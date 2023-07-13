---
title: Serilog Per Sink Filters
description: A way to apply filters to only one Serilog Sink
tags: [ Programming, C# ]
---

It's helpful to have all log events sent to the console to make development easier, but it's best to not have other logging sinks spammed with debug and verbose level logs.

## Methods that don't work

* The usual way to filter events in Serilog is like this:

	```csharp
	loggerConfiguration
		.MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
		.WriteTo.Whatever()
		.WriteTo.Console();
	```

	However, that will apply to all sinks, including the console.

* Another way is to apply the override inside a sub-logger:

	```csharp
	loggerConfiguration
		.WriteTo.Logger(loggerConfiguration2 => loggerConfiguration2
			.MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
			.WriteTo.Whatever())
		.WriteTo.Console();
	```

	However, the override will be ignored.

* Most sinks provide a `restrictedToMinimumLevel` option, but that applies to all log event sources.

## A working method

A way that actually works is to use `.Filter` in a sub-logger:

```csharp
loggerConfiguration
	.WriteTo.Logger(lc => lc
		// These are things like "CTRL+C to exit" messages
		// Use a sub-logger to let them go to the console, but not to the DB
		.Filter.ByExcluding(le => Matching.FromSource("Microsoft").Invoke(le)
			&& (le.Level == LogEventLevel.Verbose
				|| le.Level == LogEventLevel.Debug
				|| le.Level == LogEventLevel.Information))
		.WriteTo.Whatever())
	.WriteTo.Console();
```
