---
title: Add Required HTML Attribute In ASP.NET Core
description: A tag helper that adds the required attribute to inputs for properties marked as required
tags: [ Programming, C#, ASP.NET Core ]
---

By default using the input `asp-for` tag helper on `input`s will not add the `required` attribute for properties marked with `[Required]`. It instead relies on jQuery Validation attributes. This can be a problem if you don't use jQuery and for accessibility.

This tag helper will run alongside the default `asp-for` helper and will add the `required` attribute if the matching property is marked `[Required]`. This will also add the `required` attribute for non-nullable types. It will not add the attribute to checkboxes, as that indicates the checkbox must be checked.

```csharp
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using Microsoft.AspNetCore.Razor.TagHelpers;
using System.ComponentModel.DataAnnotations;

/// <summary>
/// The default input and select tag helpers don't add the <c>required</c> attribute to required
/// elements, so this does it instead
/// </summary>
[HtmlTargetElement("input", Attributes = "asp-for")]
[HtmlTargetElement("select", Attributes = "asp-for")]
[HtmlTargetElement("textarea", Attributes = "asp-for")]
public class RequiredInputTagHelper : TagHelper
{
	public override int Order { get => int.MaxValue; }

	[HtmlAttributeName("asp-for")]
	public ModelExpression For { get; set; }

	public override void Process(TagHelperContext context, TagHelperOutput output)
	{
		base.Process(context, output);

		// Don't do anything if there's already a required attribute
		if (context.AllAttributes["required"] is not null)
			return;

		// Don't make check boxes required, that indicates that it must be checked
		if (this.For.Model is bool)
			return;

		// The property has [Required] or it is a value type (e.g. int) and is not nullable (e.g. int?)
		if (this.For.ModelExplorer.Metadata.ValidatorMetadata.Any(a => a is RequiredAttribute)
			|| (this.For.ModelExplorer.ModelType.IsValueType
				&& (!this.For.ModelExplorer.ModelType.IsGenericType
					|| (this.For.ModelExplorer.ModelType.IsGenericType
						&& this.For.ModelExplorer.ModelType.GetGenericTypeDefinition() != typeof(Nullable<>)))))
			output.Attributes.Add(new TagHelperAttribute("required"));
	}
}
```
