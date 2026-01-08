--[[
    Bandwidth Tracker Module
    Tracks bandwidth usage per request and periodically flushes to database
]]

local _M = {}

-- Use shared dict for fast in-memory counting
local active_streams = ngx.shared.active_streams

-- Keys for bandwidth counters
local DAILY_KEY = "bw_daily"
local HOURLY_KEY = "bw_hourly"

-- Add bytes to today's counter
function _M.add_bytes(bytes_sent)
    if not bytes_sent or bytes_sent <= 0 then
        return
    end
    
    -- Increment daily counter
    local new_val, err = active_streams:incr(DAILY_KEY, bytes_sent, 0)
    if not new_val then
        ngx.log(ngx.ERR, "Failed to increment bandwidth counter: " .. (err or "unknown"))
    end
    
    -- Also increment hourly counter with current hour
    local hour = os.date("%H")
    local hourly_key = HOURLY_KEY .. "_" .. hour
    active_streams:incr(hourly_key, bytes_sent, 0)
end

-- Get current daily counter (called by flush worker)
function _M.get_daily_bytes()
    return tonumber(active_streams:get(DAILY_KEY)) or 0
end

-- Get and reset daily counter (called at midnight or flush)
function _M.get_and_reset_daily()
    local bytes = _M.get_daily_bytes()
    active_streams:set(DAILY_KEY, 0)
    return bytes
end

-- Flush to database via Python API
function _M.flush_to_db()
    local bytes = _M.get_and_reset_daily()
    
    if bytes > 0 then
        -- Call Python API to update database
        local res = ngx.location.capture("/_internal_bandwidth_update", {
            method = ngx.HTTP_GET,
            args = { bytes = bytes },
            ctx_no_inherit = true
        })
        
        if res.status == 200 then
            ngx.log(ngx.INFO, "Bandwidth flushed: " .. bytes .. " bytes")
        else
            ngx.log(ngx.ERR, "Failed to flush bandwidth: " .. (res.status or "unknown"))
            -- Put bytes back if flush failed
            active_streams:incr(DAILY_KEY, bytes, 0)
        end
    end
end

-- Initialize timer to flush every 60 seconds (called from init_worker_by_lua)
function _M.init_timer()
    local delay = 60 -- seconds
    local handler
    handler = function(premature)
        if premature then
            return
        end
        
        -- Flush bandwidth stats
        _M.flush_to_db()
        
        -- Reschedule
        local ok, err = ngx.timer.at(delay, handler)
        if not ok then
            ngx.log(ngx.ERR, "Failed to create bandwidth timer: " .. err)
        end
    end
    
    -- Start timer
    local ok, err = ngx.timer.at(delay, handler)
    if not ok then
        ngx.log(ngx.ERR, "Failed to create initial bandwidth timer: " .. err)
    end
end

return _M
