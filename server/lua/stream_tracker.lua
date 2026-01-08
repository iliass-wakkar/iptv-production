--[[
    Stream Tracking Module
    Tracks active streams per user in shared memory
    Used for enforcing concurrent stream limits
]]

local _M = {}

local active_streams = ngx.shared.active_streams
local user_limits = ngx.shared.user_limits

-- Stream timeout in seconds (if no activity for this long, stream is considered dead)
local STREAM_TIMEOUT = 60

-- Get user's max streams from cache or database
function _M.get_max_streams(user_id)
    local cached = user_limits:get("user_" .. user_id)
    if cached then
        return tonumber(cached)
    end
    
    -- Default limits if not cached (will be set by auth check)
    -- 1 = regular, 3 = VIP, 999 = admin
    return 1
end

-- Set user's max streams in cache
function _M.set_max_streams(user_id, max_streams)
    user_limits:set("user_" .. user_id, max_streams, 3600) -- Cache for 1 hour
end

-- Get current stream count for a user
function _M.get_stream_count(user_id)
    local key = "user_" .. user_id .. "_count"
    local count = active_streams:get(key)
    return tonumber(count) or 0
end

-- Register a new stream for a user+channel
-- Returns: true if allowed, false if limit reached
function _M.start_stream(user_id, channel_id, max_streams)
    local count_key = "user_" .. user_id .. "_count"
    local stream_key = "user_" .. user_id .. "_ch_" .. channel_id
    
    -- Check if this exact stream already exists (same user, same channel)
    local existing = active_streams:get(stream_key)
    if existing then
        -- Update last activity time, don't increment count
        active_streams:set(stream_key, ngx.now(), STREAM_TIMEOUT + 30)
        return true, "existing"
    end
    
    -- Check current stream count
    local current_count = _M.get_stream_count(user_id)
    
    if current_count >= max_streams then
        return false, "limit_reached"
    end
    
    -- Increment stream count atomically
    local new_count, err = active_streams:incr(count_key, 1, 0)
    if not new_count then
        ngx.log(ngx.ERR, "Failed to increment stream count: " .. (err or "unknown"))
        return false, "error"
    end
    
    -- Register this specific stream
    active_streams:set(stream_key, ngx.now(), STREAM_TIMEOUT + 30)
    
    -- Set count expiry (auto-cleanup if NGINX restarts)
    active_streams:expire(count_key, STREAM_TIMEOUT + 60)
    
    ngx.log(ngx.INFO, "Stream started: user=" .. user_id .. " channel=" .. channel_id .. 
            " count=" .. new_count .. "/" .. max_streams)
    
    return true, "started"
end

-- Stop a stream for a user+channel
function _M.stop_stream(user_id, channel_id)
    local count_key = "user_" .. user_id .. "_count"
    local stream_key = "user_" .. user_id .. "_ch_" .. channel_id
    
    -- Check if this stream exists
    local existing = active_streams:get(stream_key)
    if not existing then
        return -- Stream doesn't exist, nothing to do
    end
    
    -- Remove the stream
    active_streams:delete(stream_key)
    
    -- Decrement stream count
    local new_count = active_streams:incr(count_key, -1, 0)
    if new_count and new_count < 0 then
        active_streams:set(count_key, 0)
        new_count = 0
    end
    
    ngx.log(ngx.INFO, "Stream stopped: user=" .. user_id .. " channel=" .. channel_id .. 
            " remaining=" .. (new_count or 0))
end

-- Update stream activity (heartbeat)
function _M.heartbeat(user_id, channel_id)
    local stream_key = "user_" .. user_id .. "_ch_" .. channel_id
    local existing = active_streams:get(stream_key)
    
    if existing then
        active_streams:set(stream_key, ngx.now(), STREAM_TIMEOUT + 30)
        return true
    end
    
    return false
end

-- Get debug info for all streams of a user
function _M.get_user_streams(user_id)
    local streams = {}
    local keys = active_streams:get_keys(100)
    local prefix = "user_" .. user_id .. "_ch_"
    
    for _, key in ipairs(keys) do
        if key:sub(1, #prefix) == prefix then
            local channel_id = key:sub(#prefix + 1)
            local last_activity = active_streams:get(key)
            table.insert(streams, {
                channel_id = channel_id,
                last_activity = last_activity
            })
        end
    end
    
    return streams
end

return _M
