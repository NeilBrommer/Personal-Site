---
title: C# Pagination Tools
description: A couple of classes that make pagination much easier.
tags: [ Programming, C#, Entity Framework ]
---

A couple of classes that make pagination much easier.

There are two core classes:
* `PaginationOptions` contains the the details needed for fetching data
* `PaginatedResults` extends `PaginationOptions` and contains the results and the number of total results. It also contains a bunch of shortcut properties for calculating common pagination values like the total number of pages, the number of the first result on the current page, etc.

## How To Use It

```cs
int pageNumber = 1;
int resultsPerPage = 25;
PaginatedResults<Thing> results = await db.Things
	.Where(t => t.RecordInactiveDate == null)
	.ToPaginatedResultsAsync(new PaginationOptions(pageNumber, resultsPerPage));
```

## Code

```cs
using System.Runtime.Serialization;
using System.Text.Json.Serialization;

namespace ASIS.Shared;

/// <summary>Defines how to get paginated data</summary>
[DataContract(IsReference = true)]
public class PaginationOptions
{
	private int? _resultsPerPage;
	private int _pageNumber;

	/// <summary>The number of results per page</summary>
	/// <remarks><c>null</c> for unlimited</remarks>
	[DataMember]
	public int? ResultsPerPage
	{
		get => this._resultsPerPage;
		set
		{
			if (value is not null and <= 0)
				throw new ArgumentOutOfRangeException(nameof(this.ResultsPerPage),
					$"{this.ResultsPerPage} must be greater than 0");

			this._resultsPerPage = value;
		}
	}

	/// <summary>The page number to get</summary>
	/// <remarks>One indexed</remarks>
	[DataMember]
	public int PageNumber
	{
		get => this._pageNumber;
		set
		{
			if (value <= 0)
				throw new ArgumentOutOfRangeException(nameof(this.PageNumber),
					$"{this.PageNumber} must be greater than 0");

			this._pageNumber = value;
		}
	}

	/// <summary>
	/// This constructor exists so that MVC can instantiate the object before mapping is contents
	/// </summary>
	public PaginationOptions() { }

	public PaginationOptions(int pageNumber, int? resultsPerPage)
	{
		this.PageNumber = pageNumber;
		this.ResultsPerPage = resultsPerPage;
	}
}

/// <summary>
/// This exists because <see cref="TagHelper"/>s can't be generic, so passing them an actual
/// <see cref="PaginatedResults{T}"/> wouldn't work
/// </summary>
public interface IPaginatedResults
{
	public int PageNumber { get; }
	public int LastPageNumber { get; }
	public int? ResultsPerPage { get; }
	public int CurrentPageResultsCount { get; }
	public int TotalResultsCount { get; }
	public int FirstResultNumber { get; }
	public int LastResultNumber { get; }
	public bool IsFirstPage { get; }
	public bool IsLastPage { get; }
	public int PreviousPageNumber { get; }
	public int NextPageNumber { get; }
}


/// <summary>
/// An extension of <see cref="PaginationOptions"/> that contains the results from a query and uses
/// them to calculate additional pagination info
/// </summary>
/// <typeparam name="T">
/// The <see cref="IEnumerable{U}"/> type that will contain the data (<typeparamref name="U"/>)
/// </typeparam>
/// <typeparam name="U">The data type of the results</typeparam>
[DataContract(IsReference = true)]
public class PaginatedResults<T> : PaginationOptions, IPaginatedResults where T : class
{
	[JsonConstructor]
	public PaginatedResults(int pageNumber, int? resultsPerPage, IEnumerable<T> results,
		int totalResultsCount) : base(pageNumber, resultsPerPage)
	{
		this.Results = results;
		this.TotalResultsCount = totalResultsCount;
	}

	public PaginatedResults(PaginationOptions? paginationOptions, IEnumerable<T> results,
		int totalResultsCount)
		: base(paginationOptions?.PageNumber ?? 1, paginationOptions?.ResultsPerPage)
	{
		this.Results = results;
		this.TotalResultsCount = totalResultsCount;
	}

	/// <summary>
	/// The total number of results being paginated. This is used for determining where you are
	/// in the list.
	/// </summary>
	[DataMember]
	public int TotalResultsCount { get; set; }

	/// <summary>
	/// The number of results on the current page
	/// </summary>
	[DataMember]
	public int CurrentPageResultsCount { get => this.Results.Count(); }

	/// <summary>
	/// The number of the first result on the current page. This is calculated using
	/// <see cref="ResultsPerPage"/>, <see cref="PageNumber"/>, and <see cref="TotalResults"/>.
	/// </summary>
	[DataMember]
	public int FirstResultNumber
	{
		get
		{
			if (this.ResultsPerPage is null)
				return 1;

			return ((int)this.ResultsPerPage * (this.PageNumber - 1)) + 1;
		}
	}

	/// <summary>
	/// The number of the last result on the current page. This is calculated using
	/// <see cref="ResultsPerPage"/>, <see cref="PageNumber"/>, and <see cref="TotalResults"/>.
	/// </summary>
	[DataMember]
	public int LastResultNumber
	{
		get
		{
			if (this.ResultsPerPage is null)
				return this.Results.Count();

			return ((int)this.ResultsPerPage * (this.PageNumber - 1)) + this.CurrentPageResultsCount;
		}
	}

	/// <summary>
	/// The total number of pages based on the <see cref="ResultsPerPage"/> and
	/// <see cref="TotalResultsCount"/>
	/// </summary>
	[DataMember]
	public int LastPageNumber
	{
		get
		{
			if (this.ResultsPerPage is null)
				return 1;

			return (int)Math.Ceiling(this.TotalResultsCount / (double)this.ResultsPerPage);
		}
	}

	/// <summary>
	/// A shortcut that checks if <see cref="PaginationOptions.PageNumber"/> is equal to 1
	/// </summary>
	[DataMember]
	public bool IsFirstPage { get => this.PageNumber == 1; }

	/// <summary>
	/// A shortcut that checks if <see cref="PaginationOptions.PageNumber"/> is equal to
	/// <see cref="LastPageNumber"/>
	/// </summary>
	[DataMember]
	public bool IsLastPage { get => this.PageNumber == this.LastPageNumber; }

	/// <summary>A shortcut to check if the current page is not <c>1</c></summary>
	[DataMember]
	public bool HasPreviousPage { get => !this.IsFirstPage; }

	/// <summary>
	/// A shortcut to check if the current page is not <see cref="LastPageNumber"/>
	/// </summary>
	[DataMember]
	public bool HasNextPage { get => !this.IsLastPage; }

	/// <summary>
	/// The number of the previous page or <c>1</c> if <see cref="IsFirstPage"/>
	/// </summary>
	[DataMember]
	public int PreviousPageNumber
	{
		get
		{
			if (this.IsFirstPage)
				return 1;

			return this.PageNumber - 1;
		}
	}

	/// <summary>
	/// The number of the next page or <see cref="LastPageNumber"/> if <see cref="IsLastPage"/>
	/// </summary>
	[DataMember]
	public int NextPageNumber
	{
		get
		{
			if (this.IsLastPage)
				return this.LastPageNumber;

			return this.PageNumber + 1;
		}
	}

	[DataMember]
	public IEnumerable<T> Results { get; set; }
}

public static class PaginationOptionsExtensionMethods
{
	/// <summary>
	/// Applies a Skip/Take to the query and returns it
	/// <para>
	/// Simply returns the unmodified <paramref name="query"/> if the <paramref name="options"/> is
	/// null (i.e. null means don't paginate)
	/// </para>
	/// </summary>
	/// <param name="query">The query to paginate</param>
	/// <param name="options">The options for paginating the query</param>
	public static IQueryable<T> ApplyPaginationOptions<T>(this IQueryable<T> query,
		PaginationOptions? options)
	{
		if (options is null || options.ResultsPerPage is null)
			return query;

		return query
			.Skip((options.PageNumber - 1) * (int)options.ResultsPerPage)
			.Take((int)options.ResultsPerPage);
	}

	/// <summary>
	/// Execute the <paramref name="query"/> with the <paramref name="paginationOptions"/> to create
	/// a <see cref="PaginatedResults{T, U}"/>
	/// </summary>
	/// <remarks>
	/// This executes the <paramref name="query"/> twice: once with <c>ApplyPaginationOptions</c>
	/// and <c>ToList</c> to get the <see cref="PaginatedResults{T, U}.Results"/> and a second
	/// time with <c>Count</c> to get the <see cref="PaginatedResults{T, U}.TotalResultsCount"/>
	/// </remarks>
	/// <typeparam name="T">The result data type</typeparam>
	/// <param name="query">
	/// The query to execute to get the <see cref="PaginatedResults{T, U}.Results"/> and
	/// <see cref="PaginatedResults{T, U}.TotalResultsCount"/>
	/// </param>
	/// <param name="paginationOptions">
	/// The pagination options to apply to the <paramref name="query"/> to get the
	/// <see cref="PaginatedResults{T, U}.Results"/>
	/// </param>
	public static PaginatedResults<T> ToPaginatedResults<T>(this IQueryable<T> query,
		PaginationOptions? paginationOptions)
		where T : class
	{
		return new PaginatedResults<T>(
			paginationOptions,
			query.ApplyPaginationOptions(paginationOptions).ToList(),
			query.Count());
	}
}
```

This async extension method requires the project it's in to have the Microsoft.EntityFrameworkCore installed:

```cs
using ASIS.Shared;
using Microsoft.EntityFrameworkCore;

namespace ASIS.Shared;

/// <summary>
/// The async versions of <see cref="IQueryable{T}"/> functions require EF Core, so it's better to
/// put functions that need those here than in <see cref="UREC.Attic.Shared"/>
/// </summary>
public static class PaginationTools
{
	/// <summary>
	/// Execute the <paramref name="query"/> with the <paramref name="paginationOptions"/> to create
	/// a <see cref="PaginatedResults{T}"/>
	/// </summary>
	/// <remarks>
	/// This executes the <paramref name="query"/> twice: once with <c>ApplyPaginationOptions</c>
	/// and <c>ToListAsync</c> to get the <see cref="PaginatedResults{T}.Results"/> and a second
	/// time with <c>CountAsync</c> to get the <see cref="PaginatedResults{T}.TotalResultsCount"/>
	/// </remarks>
	/// <typeparam name="T">The result data type</typeparam>
	/// <param name="query">
	/// The query to execute to get the <see cref="PaginatedResults{T}.Results"/> and
	/// <see cref="PaginatedResults{T}.TotalResultsCount"/>
	/// </param>
	/// <param name="paginationOptions">
	/// The pagination options to apply to the <paramref name="query"/> to get the
	/// <see cref="PaginatedResults{T}.Results"/>
	/// </param>
	public static async Task<PaginatedResults<T>> ToPaginatedResultsAsync<T>(
		this IQueryable<T> query, PaginationOptions paginationOptions,
		CancellationToken cancellationToken = default)
		where T : class
	{
		var results = await query
			.ApplyPaginationOptions(paginationOptions)
			.ToListAsync(cancellationToken);
		var count = await query.CountAsync(cancellationToken);

		return new PaginatedResults<T>(
			paginationOptions,
			results,
			count);
	}
}
```
