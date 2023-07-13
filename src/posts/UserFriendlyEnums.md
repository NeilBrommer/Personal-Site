---
title: User Friendly C# Enums
description: A couple of extension methods to make getting user friendly information from attributes on enums
tags: [ Programming, C# ]
---

These extension methods will get the name and description from the `[Display]` attribute on enums. This allows you to add user-friendly names and descriptions on the enums themselves.

## How to use

```csharp
public enum MyEnum
{
	[Display(Name = "First Value", Description = "First value description")]
	FirstValue,
	[Display(Name = "Second Value")]
	SecondValue,
	ThirdValue
}

MyEnum.FirstValue.GetDisplayName(); // "First Value"
MyEnum.ThirdValue.GetDisplayName(); // "ThirdValue"

MyEnum.FirstValue.GetDisplayDescription(); // "First value description"
MyEnum.SecondValue.GetDisplayDescription(); // null
MyEnum.ThirdValue.GetDisplayDescription(); // null

// Generate a list of options from an enum
IList<string> options = Enum.GetValues<MyEnum>()
	.Select(e => e.GetDisplayName())
	.ToList();
```

## Code

```csharp
using System.ComponentModel.DataAnnotations;
using System.Reflection;

public static class Extensions
{
	#region Enum DisplayAttribute

	/// <summary>
	/// Gets the name from the DisplayAttribute or returns the enum as a string
	/// if there is no DisplayAttribute name
	/// </summary>
	public static string GetDisplayName(this Enum value)
	{
		return value.GetType()
			.GetMember(value.ToString())
			.First()
			.GetCustomAttribute<DisplayAttribute>()
			?.Name
			?? value.ToString();
	}

	/// <summary>Gets the description from the DisplayAttribute</summary>
	public static string? GetDisplayDescription(this Enum value)
	{
		return value.GetType()
			.GetMember(value.ToString())
			.FirstOrDefault()
			?.GetCustomAttribute<DisplayAttribute>()
			?.Description;
	}

	#endregion
}
```
