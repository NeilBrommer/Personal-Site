---
title: Pluggable Expressions In Entity Framework
description: The application structure I've been using as an alternative to the repository pattern
tags: [ Programming, C#, Entity Framework ]
---

[[toc]]

After maintaining a mid-sized application using a repository pattern, I've found this method to be more flexible and easier to test.

## Pluggable expressions

Expressions can be saved to variables (or returned by properties or functions) just like any object and just referenced in a query:

```csharp
Expression<Func<Thing, bool>> registrationIsOpen =
	t => t.RegistrationOpenDate < DateTime.Now
		&& t.RegistrationCloseDate > DateTime.Now;

IList<Thing> openThings = db.Things
	.Where(registrationIsOpen)
	.ToList();
```

This also has the benefit of being very declarative; it's pretty easy to tell what the query is doing with `.Where(registrationIsOpen)` at a glance, even if you don't know much about `Thing` or the database structure. This becomes more of an advantage the more complicated the filter is.

These are also easy to test. Just create an in-memory list, run the expression against the list, and verify the results. Like with all EF queries though some expressions can't be translated, so you need to watch out for that.

You can have static classes filled with a bunch of pre-built expressions that you can pick from and apply as needed. If you have a one-off filter you need to use, then you can just directly use a lambda instead of a pre-built expression.

This can also be used on anything that `Where` can be called on. So if you already have a list, you can just reuse the same expression in a LINQ query on that list. Another useful case for this is map functions. Just like you can create expressions to pass to `.Where()`, you can also create expressions to pass to `.Select()`:

```csharp
public class ThingViewModel {
	public int ThingId { get; set; }
	public string ThingName { get; set; }
	public DateTime RegistrationOpenDate { get; set; }
	public DateTime RegistrationCloseDate { get; set; }
	...

	public static Expression<Func<Thing, ThingViewModel>> Map() {
		return t => new ThingViewModel {
			ThingId = t.ThingId,
			ThingName = t.ThingName,
			RegistrationOpenDate = t.RegistrationOpenDate,
			RegistrationCloseDate = t.RegistrationCloseDate,
			...
		};
	}
}
```

Then to use it:

```csharp
IList<ThingViewModel> things = db.Things
	.Select(ThingViewModel.Map())
	.ToList();
```

## Nested expressions

EF doesn't actually execute the LINQ query - it uses reflection to pick the query apart and translate it into a SQL query. Because of this, EF can only translate function calls and expressions it recognizes. This becomes a problem when you have nested expressions like this:

```csharp
Expression<Func<Thing, bool>> isPastRegistrationOpenDate =
	t => t.RegistrationOpenDate < DateTime.Now;
Expression<Func<Thing, bool>> isBeforeRegistrationCloseDate =
	t => t.RegistrationCloseDate > DateTime.Now;
Expression<Func<Thing, bool>> registrationIsOpen =
	t => isPastRegistrationOpenDate.Invoke(t)
		&& isBeforeRegistrationCloseDate.Invoke(t);

IList<Thing> openThings = db.Things
	.Where(registrationIsOpen)
	.ToList();
```

This query will fail because Entity Framework can't doesn't have a translation for `isPastRegistrationOpenDate` and `isBeforeRegistrationCloseDate`.

In this case, the `registrationIsOpen` in `.Where(registrationIsOpen)` is replaced by the actual expression and EF will read the actual underlying expression. However, what EF sees when it tries to translate the query is references to two variables and an `Invoke` function that it doesn't understand.

The workaround for this is to use [LINQKit's `.AsExpandable()`](https://github.com/scottksmith95/LINQKit#plugging-expressions-into-entitysets--entitycollections-the-solution). By adding this to the query, it will alter the query and replace ("expand") the references to expressions with the expressions themselves. Then EF will see expressions that it understands.

So unlike the query above, this will work:

```csharp
Expression<Func<Thing, bool>> isPastRegistrationOpenDate =
	t => t.RegistrationOpenDate < DateTime.Now;
Expression<Func<Thing, bool>> isBeforeRegistrationCloseDate =
	t => t.RegistrationCloseDate > DateTime.Now;
Expression<Func<Thing, bool>> registrationIsOpen =
	t => isPastRegistrationOpenDate.Invoke(t)
		&& isBeforeRegistrationCloseDate.Invoke(t);

IList<Thing> openThings = db.Things
	.AsExpandable()
	.Where(registrationIsOpen)
	.ToList();
```

And that's it. Just add `.AsExpandable()` to your query and it will work.

Another example using the above view model example:

```csharp
public static class ThingExpressions {
	public static Expression<Func<Thing, bool>> IsPastRegistrationOpenDate() {
		return t => t.RegistrationOpenDate < DateTime.Now;
	}

	public static Expression<Func<Thing, bool>> IsBeforeRegistrationCloseDate() {
		return t => t.RegistrationCloseDate > DateTime.Now;
	}

	public static Expression<Func<Thing, bool>> RegistrationIsOpen() {
		return t => IsPastRegistrationOpenDate.Invoke(t)
			&& IsBeforeRegistrationCloseDate.Invoke(t);
	}
}

public class ThingViewModel {
	public int ThingId { get; set; }
	public string ThingName { get; set; }
	public bool IsRegistrationOpen { get; set; }

	public static Expression<Func<Thing, ThingViewModel>> Map() {
		return t => new ThingViewModel {
			ThingId = t.ThingId,
			ThingName = t.ThingName,
			// This will throw an exception if AsExpandable isn't used
			IsRegistrationOpen = ThingExpressions.RegistrationIsOpen().Invoke(t)
		};
	}
}
```

Then to use it:

```csharp
IList<ThingViewModel> things = db.Things
	.AsExpandable()
	.Select(ThingViewModel.Map())
	.ToList();
```

## Compared to repositories

The usual way to centralize filters for database queries with Entity Framework is to use repositories with methods like this:

```csharp
public IList<Thing> GetThings(bool whereRegistrationOpen = false) {
	var query = this.db.Things
		.AsQueryable();

	if (whereRegistrationOpen)
		query = query
			.Where(t => t.RegistrationOpenDate < DateTime.Now)
			.Where(t => t.RegistrationCloseDate > DateTime.Now);

	return query.ToList();
}
```

However, for large, complex objects this can quickly bloat the function with dozens of options. This makes the method very large (potentially hundreds of lines) and more awkward to ensure that tests each only test a specific piece of the method.

Also, the filters themselves are sealed in the repository method. You can't use them in a different way than the repository is built for (like applying the filter to an in-memory list or using them to set a property in a `.Select()`).
