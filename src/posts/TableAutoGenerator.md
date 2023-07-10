---
title: ASP.NET Core Table Generator
description: A tag helper that takes a list and generates a table
tags: [ Programming, C#, ASP.NET Core ]
---

This tag helper takes any `IEnumerable` and will use reflection to generate a table for it. This will pick up on attributes in the model for customizing the output.

## How To Use

The model in the `IEnumerable`:

```csharp
public class Thing
{
	// Don't make a column for this property
	[Display(AutoGenerateField = false)]
	public int ThingId { get; set; }

	// Use "Thing Name" for the column header instead of "ThingName"
	[Display(Name = "Thing Name")]
	public string ThingName { get; set; }

	// Use string.Format with the DataFormatString
	[DisplayFormat(DataFormatString = "{0:C}")]
	public decimal Price { get; set; }
}
```

Then use the tag helper in the view:

```cshtml
<table asp-for="Things"></table>
```

## Code

The tag helper:

```csharp
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using Microsoft.AspNetCore.Razor.TagHelpers;
using System.ComponentModel.DataAnnotations;
using System.Reflection;

/// <summary>
/// When the <see cref="For"/> is a list, fill the table with the list data with
/// columns for each property.
/// <para>
/// Properties can be hidden from the table by adding <c>[Diaplay(AutoGenerateField = false)]</c>
/// </para>
/// <para>
/// The column heading for each property is the property name by default. This can be overriden by
/// adding <c>[Display(Name = "Property Name")]</c>
/// </para>
/// </summary>
[HtmlTargetElement("table", Attributes = "asp-for")]
public class TableTagHelper : TagHelper
{
	[HtmlAttributeName("asp-for")]
	public ModelExpression For { get; set; }

	public override void Process(TagHelperContext context, TagHelperOutput output)
	{
		var modelType = this.For.ModelExplorer.ModelType.GenericTypeArguments[0];
		var list = this.For.Model as IEnumerable<object>;

		if (list is null)
			output.TagName = "";

		// Don't display properties that have AutoGenerateField set to false
		IList<PropertyInfo> properties = modelType.GetProperties()
			.Where(p => !p.GetCustomAttributes<DisplayAttribute>(false)
				.Any(a => a.GetAutoGenerateField() == false))
			.ToList();

		// Header row
		List<TagBuilder> tableHeadCells = properties
			.Select(p =>
			{
				string displayName = p.GetCustomAttributes<DisplayAttribute>(false)
					.Where(a => !string.IsNullOrEmpty(a.GetName()))
					.FirstOrDefault()
					?.GetName()
					?? p.Name;

				TagBuilder th = new("th");
				th.InnerHtml.Append(displayName);

				return th;
			})
			.ToList();

		TagBuilder theadTr = new("tr");
		tableHeadCells.ForEach(th => theadTr.InnerHtml.AppendHtml(th));

		TagBuilder thead = new("thead");
		thead.InnerHtml.AppendHtml(theadTr);
		output.Content.AppendHtml(thead);


		// Content rows
		List<TagBuilder> tableRows = list
			.Select(item =>
			{
				List<TagBuilder> cells = properties
					.Select(p =>
					{
						TagBuilder td = new("td");

						var content = p.GetValue(item);
						string dataFormatString = p.GetCustomAttributes<DisplayFormatAttribute>(false)
							.Where(a => !string.IsNullOrWhiteSpace(a.DataFormatString))
							.Select(a => a.DataFormatString)
							.FirstOrDefault();

						if (dataFormatString is not null)
							td.InnerHtml.Append(string.Format(dataFormatString, content));
						else if (content is not null)
							td.InnerHtml.Append(content.ToString());

						return td;
					})
					.ToList();

				TagBuilder tr = new("tr");
				cells.ForEach(td => tr.InnerHtml.AppendHtml(td));
				return tr;
			})
			.ToList();

		TagBuilder tbody = new("tbody");
		tableRows.ForEach(tr => tbody.InnerHtml.AppendHtml(tr));
		output.Content.AppendHtml(tbody);
	}
}
```
