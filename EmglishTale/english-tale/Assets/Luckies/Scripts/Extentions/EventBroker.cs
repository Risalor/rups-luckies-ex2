using System;
using System.Collections.Generic;

public enum EventManagerEnum
{
    DATA_LOADED,
    SERVER_STARTED,
    CLIENT_CONNECTED,

    SETTING_CHANGED,

    WALLET_UPDATE,
    WALLET_UPDATE_SOFT,
    WALLET_UPDATE_HARD,

    UNIT_START_UPGRADING,
    UNIT_IS_UPGRADING,
    UNIT_DONE_UPGRADING,
}

public static class EventBroker
{
    public delegate void EventCallback<T>(T data);
    public delegate void EventCallback<T, T1>(T data, T1 arg);
    public delegate void EventCallback<T, T1, T2>(T data, T1 arg, T2 arg1);
    public delegate void EventCallback();

    private static Dictionary<(EventManagerEnum, Type), List<Delegate>> _events = new Dictionary<(EventManagerEnum, Type), List<Delegate>>();

    public static void RegisterEvent(EventManagerEnum eventName, EventCallback listener)
    {
        if (_events.TryGetValue((eventName, null), out var listeners))
        {
            if (!listeners.Contains(listener))
            {
                listeners.Add(listener);
            }
        } else
        {
            _events.Add((eventName, null), new List<Delegate> { listener });
        }
    }

    public static void RegisterEvent<T>(EventManagerEnum eventName, EventCallback<T> listener)
    {
        if (_events.TryGetValue((eventName, typeof(T)), out var listeners))
        {
            if (!listeners.Contains(listener))
            {
                listeners.Add(listener);
            }
        } else
        {
            _events.Add((eventName, typeof(T)), new List<Delegate> { listener });
        }
    }

    public static void RegisterEvent<T>(EventManagerEnum eventName, EventCallback listener)
    {
        if (_events.TryGetValue((eventName, typeof(T)), out var listeners))
        {
            if (!listeners.Contains(listener))
            {
                listeners.Add(listener);
            }
        } else
        {
            _events.Add((eventName, typeof(T)), new List<Delegate> { listener });
        }
    }

    public static void RegisterEvent<T, T1>(EventManagerEnum eventName, EventCallback<T, T1> listener)
    {
        if (_events.TryGetValue((eventName, typeof(T)), out var listeners))
        {
            if (!listeners.Contains(listener))
            {
                listeners.Add(listener);
            }
        } else
        {
            _events.Add((eventName, typeof(T)), new List<Delegate> { listener });
        }
    }

    public static void RegisterEvent<T, T1>(EventManagerEnum eventName, EventCallback<T1> listener)
    {
        if (_events.TryGetValue((eventName, typeof(T)), out var listeners))
        {
            if (!listeners.Contains(listener))
            {
                listeners.Add(listener);
            }
        } else
        {
            _events.Add((eventName, typeof(T)), new List<Delegate> { listener });
        }
    }

    public static void RegisterEvent<T, T1, T2>(EventManagerEnum eventName, EventCallback<T, T1, T2> listener)
    {
        if (_events.TryGetValue((eventName, typeof(T)), out var listeners))
        {
            if (!listeners.Contains(listener))
            {
                listeners.Add(listener);
            }
        } else
        {
            _events.Add((eventName, typeof(T)), new List<Delegate> { listener });
        }
    }

    public static void UnregisterEvent(EventManagerEnum eventName, EventCallback listener)
    {
        if (_events.TryGetValue((eventName, null), out var listeners))
        {
            listeners.Remove(listener);
        }
    }

    public static void UnregisterEvent<T>(EventManagerEnum eventName, EventCallback listener)
    {
        if (_events.TryGetValue((eventName, typeof(T)), out var listeners))
        {
            listeners.Remove(listener);
        }
    }

    public static void UnregisterEvent<T>(EventManagerEnum eventName, EventCallback<T> listener)
    {
        if (_events.TryGetValue((eventName, typeof(T)), out var listeners))
        {
            listeners.Remove(listener);
        }
    }

    public static void UnregisterEvent<T, T1>(EventManagerEnum eventName, EventCallback<T, T1> listener)
    {
        if (_events.TryGetValue((eventName, typeof(T)), out var listeners))
        {
            listeners.Remove(listener);
        }
    }

    public static void UnregisterEvent<T, T1>(EventManagerEnum eventName, EventCallback<T1> listener)
    {
        if (_events.TryGetValue((eventName, typeof(T)), out var listeners))
        {
            listeners.Remove(listener);
        }
    }

    public static void UnregisterEvent<T, T1, T2>(EventManagerEnum eventName, EventCallback<T, T1, T2> listener)
    {
        if (_events.TryGetValue((eventName, typeof(T)), out var listeners))
        {
            listeners.Remove(listener);
        }
    }

    public static void ExecuteEvent(EventManagerEnum eventName)
    {
        if (_events.TryGetValue((eventName, null), out var listeners))
        {
            listeners.ForEach(listener =>
            {
                listener.DynamicInvoke();
            });
        }
    }

    public static void ExecuteEvent<T>(EventManagerEnum eventName, T data)
    {
        if (_events.TryGetValue((eventName, typeof(T)), out var listeners))
        {
            listeners.ForEach(listener =>
            {
                listener.DynamicInvoke(data);
            });
        }
    }

    public static void ExecuteEvent<T, T1>(EventManagerEnum eventName, T data, T1 arg)
    {
        if (_events.TryGetValue((eventName, typeof(T)), out var listeners))
        {
            listeners.ForEach(listener =>
            {
                listener.DynamicInvoke(data, arg);
            });
        }
    }

    public static void ExecuteEvent<T, T1>(EventManagerEnum eventName, T1 arg)
    {
        if (_events.TryGetValue((eventName, typeof(T)), out var listeners))
        {
            listeners.ForEach(listener =>
            {
                listener.DynamicInvoke(arg);
            });
        }
    }

    public static void ExecuteEvent<T, T1, T2>(EventManagerEnum eventName, T data, T1 arg, T2 arg1)
    {
        if (_events.TryGetValue((eventName, typeof(T)), out var listeners))
        {
            listeners.ForEach(listener =>
            {
                listener.DynamicInvoke(data, arg, arg1);
            });
        }
    }

    public static void ExecuteEvent<T>(EventManagerEnum eventName)
    {
        if (_events.TryGetValue((eventName, typeof(T)), out var listeners))
        {
            listeners.ForEach(listener =>
            {
                listener.DynamicInvoke();
            });
        }
    }
}
