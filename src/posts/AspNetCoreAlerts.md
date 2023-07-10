---
title: ASP.NET Core Alerts
description: Tools to display alerts across redirects
tags: [ Programming, C#, ASP.NET Core ]
---

This code allows you to store alerts that will be displayed the next time the user is served a page. This is useful for when you want to display an alert after a redirect.

## How To Use

To add an alert use one of the extension methods to add an alert to the session:

```csharp
return this.RedirectToPage("/Things/Index")
	.WithSuccess("Did the thing!");
```

Then to display the alerts, add something like this to the `_Layout.cshtml`:

```csharp
@{
	Alert[] alerts = this.TempData.GetAlerts();
}

@if (alerts != null && alerts.Any())
{
	foreach (Alert alert in alerts)
	{
		...
	}
}
```

Note that calling `TempData.GetAlerts()` will also remove all current alerts from the session so they won't be displayed on following page loads.

## Code

The alerts class:

```csharp
public class Alert
{
	public AlertType AlertType { get; set; }
	public string Text { get; set; }

	public Alert(AlertType alertType, string text)
	{
		this.AlertType = alertType;
		this.Text = text;
	}
}

public enum AlertType
{
	Success,
	Info,
	Warning,
	Error
}
```

The `AlertActionResult` To wrap the return `ActionResult` and actually add the alert to the session:

```csharp
/// <summary>
/// This is a wrapper around another action result. When executed, this adds the given alert to
/// TempData and executes the inner ActionResult
/// </summary>
public class AlertActionResult : ActionResult
{
	public ActionResult InnerResult { get; set; }
	public Alert Alert { get; set; }

	public AlertActionResult(ActionResult innerResult, Alert alert)
	{
		this.InnerResult = innerResult;
		this.Alert = alert;
	}

	public AlertActionResult(ActionResult innerResult, AlertType alertType, string alertText)
	{
		this.InnerResult = innerResult;
		this.Alert = new Alert(alertType, alertText);
	}

	public override void ExecuteResult(ActionContext context)
	{
		ITempDataDictionary tempData = context.HttpContext.RequestServices
			.GetService<ITempDataDictionaryFactory>()
			.GetTempData(context.HttpContext);

		tempData.AddAlert(this.Alert);

		this.InnerResult.ExecuteResult(context);
	}

	public override async Task ExecuteResultAsync(ActionContext context)
	{
		ITempDataDictionary tempData = context.HttpContext.RequestServices
			.GetService<ITempDataDictionaryFactory>()
			.GetTempData(context.HttpContext);

		tempData.AddAlert(this.Alert);

		if (this.InnerResult is PageResult pageResult)
		{
			// Need to do some additional setup for Razor Pages
			// See https://stackoverflow.com/questions/55989209/

			PageContext pageContext = context as PageContext
				?? throw new ArgumentException("The context must be a PageContext for Razor Pages",
					nameof(context));

			Func<PageContext, ViewContext, object> pageFactory = pageContext.HttpContext.RequestServices
				.GetRequiredService<IPageFactoryProvider>()
				.CreatePageFactory(pageContext.ActionDescriptor);

			ViewContext viewContext = new(
				pageContext,
				NullView.Instance,
				pageContext.ViewData,
				tempData,
				TextWriter.Null,
				new HtmlHelperOptions())
			{
				ExecutingFilePath = pageContext.ActionDescriptor.RelativePath
			};

			pageResult.ViewData = viewContext.ViewData;
			pageResult.Page = (PageBase)pageFactory(pageContext, viewContext);
		}

		await this.InnerResult.ExecuteResultAsync(context);
	}

	private class NullView : IView
	{
		public static readonly NullView Instance = new();

		public string Path => string.Empty;

		public Task RenderAsync(ViewContext context)
		{
			ArgumentNullException.ThrowIfNull(context, nameof(context));

			return Task.CompletedTask;
		}
	}
}
```

And some extension methods for adding and getting alerts:

```csharp
public static class AspNetExtensions
{
	private static readonly string _alertsTempDataKey = "atticAlerts";

	public static Alert[] GetAlerts(this ITempDataDictionary tempData)
	{
		if (!tempData.ContainsKey(_alertsTempDataKey))
			tempData[_alertsTempDataKey] = JsonSerializer.Serialize(Array.Empty<Alert>());

		return JsonSerializer.Deserialize<Alert[]>(tempData[_alertsTempDataKey] as string);
	}

	public static void AddAlert(this ITempDataDictionary tempData, Alert alert)
	{
		Alert[] currentAlerts = tempData.GetAlerts();

		currentAlerts = currentAlerts
			.Concat(new Alert[] { alert })
			.ToArray();
		tempData[_alertsTempDataKey] = JsonSerializer.Serialize(currentAlerts);
	}

	public static ActionResult WithSuccess(this ActionResult actionResult, string alertText)
	{
		return new AlertActionResult(actionResult, AlertType.Success, alertText);
	}

	public static ActionResult WithInfo(this ActionResult actionResult, string alertText)
	{
		return new AlertActionResult(actionResult, AlertType.Info, alertText);
	}

	public static ActionResult WithWarning(this ActionResult actionResult, string alertText)
	{
		return new AlertActionResult(actionResult, AlertType.Warning, alertText);
	}

	public static ActionResult WithError(this ActionResult actionResult, string alertText)
	{
		return new AlertActionResult(actionResult, AlertType.Error, alertText);
	}
}
```
