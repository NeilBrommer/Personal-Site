---
title: Check If User Has Access To Razor Page
description: An extension method and tag helper for checking if the user has access to a Razor Page
tags: [ Programming, C#, ASP.NET Core, Razor Pages ]
---

These extension methods and tag helpers will check if the user has access to a Razor Page. This can be useful to only display links if the user has access to that page. For example only display a link to edit an item if the user has access to the edit page.

## How To Use

Call the method directly:

```csharp
this.Url.HasPageAccess("/Things/View");
```

Or use the tag helper:

```cshtml
<a asp-page="/Things/View" asp-route-thing-id="@thingId" remove-if-unauthorized preserve-content>
	@thingId
</a>
```

`remove-if-unauthorized` will remove the link if the user doesn't have access to the page, and `preserve-content` will leave the text (the thing ID) when the link is removed.

## Code

The extension method:

```csharp
public static class AspNetExtensions
{
	/// <summary>
	/// Checks if the current user has the permissions to access the razor page at
	/// <paramref name="pagePath"/>
	/// </summary>
	/// <param name="urlHelper"></param>
	/// <param name="pagePath">The view engine path to the razor page</param>
	/// <returns>
	/// <c>true</c> if the user can access the page, <c>false</c> if they can't or if the page is
	/// invalid
	/// </returns>
	public static async Task<bool> HasPageAccess(this IUrlHelper urlHelper, string pagePath)
	{
		// Get all of the necessary services
		HttpContext httpContext = urlHelper.ActionContext.HttpContext;
		EndpointDataSource endpointDataSource = httpContext.RequestServices
			.GetRequiredService<EndpointDataSource>();
		IAuthorizationService authorizationService = httpContext.RequestServices
			.GetRequiredService<IAuthorizationService>();
		IAuthorizationPolicyProvider policyProvider = httpContext.RequestServices
			.GetRequiredService<IAuthorizationPolicyProvider>();

		// The endpoint that is:
		// 1) a razor page
		// 2) the page path matches
		Endpoint pageEndpoint = endpointDataSource.Endpoints
			.Where(e => e.Metadata
				.Where(m => m is PageActionDescriptor pad
					&& pad.ViewEnginePath.ToUpper() == pagePath.ToUpper())
				.Any())
			.FirstOrDefault();

		if (pageEndpoint is null)
			return false;

		// .AuthorizeFolder policies and AuthorizeAttributes get included in this
		IList<IAuthorizeData> pageAuthorization = pageEndpoint.Metadata
			.Select(m => m as IAuthorizeData)
			.Where(m => m is not null)
			.ToList();

		AuthorizationPolicy pagePolicy = await AuthorizationPolicy
			.CombineAsync(policyProvider, pageAuthorization);

		if (pagePolicy is null)
			return true;

		return (await authorizationService.AuthorizeAsync(httpContext.User, pageEndpoint, pagePolicy))
			.Succeeded;
	}
}
```

The tag helper:

```csharp
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Routing;
using Microsoft.AspNetCore.Mvc.TagHelpers;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using Microsoft.AspNetCore.Razor.TagHelpers;

[HtmlTargetElement("a", Attributes = "asp-page,remove-if-unauthorized")]
public class AuthorizedLinkTagHelper : AnchorTagHelper
{
	protected IUrlHelperFactory UrlHelperFactory { get; set; }
	protected IUrlHelper Url { get => this.UrlHelperFactory.GetUrlHelper(this.ViewContext); }

	/// <summary>
	/// If the current user doesn't have access to the linked page, then remove the link
	/// </summary>
	public bool RemoveIfUnauthorized { get; set; } = false;
	/// <summary>
	/// When <c>true</c> only remove the link itself (the opening and closing tags) and keep the
	/// contents of the link
	/// </summary>
	public bool PreserveContent { get; set; } = false;

	public AuthorizedLinkTagHelper(IHtmlGenerator generator,
		IUrlHelperFactory urlHelperFactory) : base(generator)
	{
		this.UrlHelperFactory = urlHelperFactory;
	}

	public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
	{
		if (!string.IsNullOrEmpty(this.Page))
		{
			// This is a link to a razor page

			string pagePath = NormalizePagePath(
				this.ViewContext.HttpContext.GetRouteData().Values["page"].ToString(),
				this.Page);

			bool hasAccessToPage = await this.Url.HasPageAccess(pagePath);

			if (!hasAccessToPage && this.PreserveContent)
			{
				output.TagName = null;
				return;
			}

			if (!hasAccessToPage)
			{
				output.TagName = null;
				output.Content.Clear();
				return;
			}
		}
		else if (!string.IsNullOrEmpty(this.Controller) && !string.IsNullOrEmpty(this.Action))
		{
			// TODO: This is a link to an MVC action
		}
	}

	/// <summary>Converts a relative Razor Page path to an absolute path</summary>
	/// <param name="currentPagePath">
	/// The path to the current page, used to get the path prefix
	/// </param>
	/// <param name="linkPath">The page to get the path to</param>
	/// <returns><paramref name="linkPath"/> as an absolute path</returns>
	private static string NormalizePagePath(string currentPagePath, string linkPath)
	{
		if (linkPath[0] == '/')
			return linkPath;

		int index = currentPagePath.LastIndexOf('/');

		if (index == currentPagePath.Length - 1)
		{
			// If the first ends in a trailing slash e.g. "/Home/", assume it's a directory.
			return currentPagePath + linkPath;
		}

		return string.Concat(currentPagePath.AsSpan(0, index + 1), linkPath);

	}
}
```
