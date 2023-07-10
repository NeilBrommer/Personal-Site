---
title: Excel Autofiller
description: A set of functions for automatically filling excel sheets
tags: [ Programming, C# ]
---

These functions will take either an `IEnumerable` or `DataTable` and uses reflection to fill an Excel sheet. This is built for [EPPlus](https://epplussoftware.com/), but it could probably be easily converted to use other libraries.

Attributes on the model can be used to customize the output. The attributes used are the same as the [table generator](/posts/TableAutoGenerator/) so you can use the same model for both.

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

Then to fill the Excel sheet:

```csharp
using ExcelPackage package = new();
package.Workbook.Worksheets.Add("Data")
	.FillReport(reportData, "Title");
```

Other functions can be used to more granularly control how the sheet is filled.

## Code

```csharp
using OfficeOpenXml.Style;
using OfficeOpenXml;
using System.ComponentModel.DataAnnotations;
using System.Data;
using System.Reflection;

/// <summary>
/// Extension methods for filling an Excel sheet with data
/// </summary>
public static class ExcelFiller
{
	#region Fill from IEnumerable

	/// <summary>
	/// Fill an Excel sheet with a title, column headers, and data.
	/// </summary>
	/// <typeparam name="T">The type of data to fill the sheet with</typeparam>
	/// <param name="worksheet">The worksheet to fill with data</param>
	/// <param name="title">The title to put at the top of the worksheet</param>
	/// <param name="data">The data to use to fill the worksheet</param>
	/// <returns>
	/// The <paramref name="worksheet"/>. This is mutable - returning it only helps with
	/// chaining.
	/// </returns>
	public static ExcelWorksheet FillReport<T>(this ExcelWorksheet worksheet,
		IEnumerable<T> data, string title)
	{
		// Set our printer settings
		worksheet.PrinterSettings.Orientation = eOrientation.Landscape;
		//workSheet.PrinterSettings.FitToPage = true;
		//workSheet.PrinterSettings.FitToHeight = 0;
		worksheet.PrinterSettings.BottomMargin = .5m;
		worksheet.PrinterSettings.LeftMargin = .5m;
		worksheet.PrinterSettings.RightMargin = .5m;
		worksheet.PrinterSettings.TopMargin = .5m;

		PropertyInfo[] propsToDisplay = GetPropertiesForExcelColumns<T>();

		// Set the title
		using (ExcelRange titleCells = worksheet.Cells[1, 1, 1, propsToDisplay.Count()])
		{
			titleCells.Merge = true;
			titleCells.Value = title;
			titleCells.Style.Font.Bold = true;
			titleCells.Style.Font.Size = 12;
			titleCells.Style.HorizontalAlignment = ExcelHorizontalAlignment.Left;
		}

		worksheet
			.InsertDataWithColumnHeaders(data, propsToDisplay, 2)
			.Cells[worksheet.Dimension.Address].AutoFitColumns();

		return worksheet;
	}

	/// <summary>
	/// Fill the given excel worksheet with the given data beginning at the given starting row.
	/// Column headers are generated based on the type <typeparamref name="T"/>
	/// </summary>
	/// <typeparam name="T">The type of data in the list</typeparam>
	/// <param name="worksheet">The worksheet to fill</param>
	/// <param name="data">The data to fill the worksheet with</param>
	/// <param name="startRow">The row to begin filling the sheet at. ONE INDEXED.</param>
	/// <returns>
	/// The <paramref name="worksheet"/>. This is mutable - returning it only helps with
	/// chaining.
	/// </returns>
	public static ExcelWorksheet InsertDataWithColumnHeaders<T>(this ExcelWorksheet worksheet,
		IEnumerable<T> data, int startRow = 1)
	{
		PropertyInfo[] propsToDisplay = GetPropertiesForExcelColumns<T>();

		return worksheet
			.InsertColumnHeaders<T>(propsToDisplay, startRow)
			.InsertData(data, propsToDisplay, startRow + 1);
	}

	/// <summary>
	/// Fill the given excel worksheet with the given data beginning at the given starting row.
	/// Column headers are generated based on the type <typeparamref name="T"/>
	/// </summary>
	/// <typeparam name="T">The type of data in the list</typeparam>
	/// <param name="worksheet">The worksheet to fill</param>
	/// <param name="data">The data to fill the worksheet with</param>
	/// <param name="propsToDisplay">
	/// The properties of <typeparamref name="T"/> to display
	/// </param>
	/// <param name="startRow">The row to begin filling the sheet at. ONE INDEXED.</param>
	/// <returns>
	/// The <paramref name="worksheet"/>. This is mutable - returning it only helps with
	/// chaining.
	/// </returns>
	public static ExcelWorksheet InsertDataWithColumnHeaders<T>(this ExcelWorksheet worksheet,
		IEnumerable<T> data, PropertyInfo[] propsToDisplay, int startRow = 1)
	{
		return worksheet
			.InsertColumnHeaders<T>(propsToDisplay, startRow)
			.InsertData(data, propsToDisplay, startRow + 1);
	}

	/// <summary>
	/// Fill the given excel worksheet with the given data beginning at the given starting row.
	/// Column headers are not created.
	/// </summary>
	/// <typeparam name="T">The type of data in the list</typeparam>
	/// <param name="worksheet">The worksheet to fill</param>
	/// <param name="data">The data to fill the worksheet with</param>
	/// <param name="startRow">The row to begin filling the sheet at. ONE INDEXED.</param>
	/// <returns>
	/// The <paramref name="worksheet"/>. This is mutable - returning it only helps with
	/// chaining.
	/// </returns>
	public static ExcelWorksheet InsertData<T>(this ExcelWorksheet worksheet,
		IEnumerable<T> data, int startRow = 1)
	{
		PropertyInfo[] propsToDisplay = GetPropertiesForExcelColumns<T>();
		return worksheet
			.InsertData(data, propsToDisplay, startRow);
	}

	/// <summary>
	/// Fill the given excel worksheet with the given data beginning at the given starting row.
	/// Column headers are not created.
	/// </summary>
	/// <typeparam name="T">The type of data in the list</typeparam>
	/// <param name="worksheet">The worksheet to fill</param>
	/// <param name="data">The data to fill the worksheet with</param>
	/// <param name="propsToDisplay">
	/// The properties of <typeparamref name="T"/> to display
	/// </param>
	/// <param name="startRow">The row to begin filling the sheet at. ONE INDEXED.</param>
	/// <returns>
	/// The <paramref name="worksheet"/>. This is mutable - returning it only helps with
	/// chaining.
	/// </returns>
	public static ExcelWorksheet InsertData<T>(this ExcelWorksheet worksheet,
		IEnumerable<T> data, PropertyInfo[] propsToDisplay, int startRow = 1)
	{
		(PropertyInfo Property, Attribute Attribute)[] propAttributes = propsToDisplay
			.Select(p =>
			{
				// Currently [DisplayFormat] is the only attribute used
				// You can add more with ??
				var attributes = p.GetCustomAttributes();
				Attribute attrib = attributes
					.OfType<DisplayFormatAttribute>()
					.FirstOrDefault();
				return (p, attrib);
			})
			.ToArray();

		// Fill the data
		int currentRow = startRow;
		foreach (var row in data)
		{
			int currentColumn = 1; // Excel indexes start at 1, not 0
			foreach ((PropertyInfo property, Attribute attribute) in propAttributes)
			{
				var cellValue = property.GetValue(row);
				ExcelRange cell = worksheet.Cells[currentRow, currentColumn];
				cell.Value = FormatCellValue(cellValue, attribute);

				currentColumn++;
			}

			currentRow++;
		}

		return worksheet;
	}

	/// <summary>
	/// Fill out the column headers for the type T
	/// </summary>
	/// <typeparam name="T">The type to use to determine column headers</typeparam>
	/// <param name="worksheet">The worksheet to add the column headers to</param>
	/// <param name="columnHeaderRow">The row to insert the column headers in</param>
	/// <returns>
	/// The <paramref name="worksheet"/>. This is mutable - returning it only helps with
	/// chaining.
	/// </returns>
	public static ExcelWorksheet InsertColumnHeaders<T>(this ExcelWorksheet worksheet,
		int columnHeaderRow = 1)
	{
		PropertyInfo[] propsToDisplay = GetPropertiesForExcelColumns<T>();
		return worksheet
			.InsertColumnHeaders<T>(propsToDisplay, columnHeaderRow);
	}

	/// <summary>
	/// Fill out the column headers for the type <typeparamref name="T"/>
	/// </summary>
	/// <typeparam name="T">The type to use to determine column headers</typeparam>
	/// <param name="worksheet">The worksheet to add the column headers to</param>
	/// <param name="propsToDisplay">The properties that should be displayed</param>
	/// <param name="columnHeaderRow">The row to insert the column headers in</param>
	/// <returns>
	/// The <paramref name="worksheet"/>. This is mutable - returning it only helps with
	/// chaining.
	/// </returns>
	public static ExcelWorksheet InsertColumnHeaders<T>(this ExcelWorksheet worksheet,
		PropertyInfo[] propsToDisplay, int columnHeaderRow = 1)
	{
		worksheet.Row(columnHeaderRow).Style.Font.Bold = true;
		for (int i = 0; i < propsToDisplay.Count(); i++)
		{
			// The Property/Attribute array indexes are 0 indexed, but the cells are 1 indexed

			DisplayAttribute[] displayAttributes = (DisplayAttribute[])propsToDisplay[i]
				.GetCustomAttributes(typeof(DisplayAttribute), false);

			if (displayAttributes.Length > 0 && displayAttributes[0].Name != null)
				worksheet.Cells[columnHeaderRow, i + 1].Value = displayAttributes[0].Name;
			else
				worksheet.Cells[columnHeaderRow, i + 1].Value = propsToDisplay[i].Name;
		}

		return worksheet;
	}

	/// <summary>
	/// Get the properties on <typeparamref name="T"/> that should be displayed in Excel sheets
	/// </summary>
	/// <typeparam name="T">The type to get the properties of</typeparam>
	public static PropertyInfo[] GetPropertiesForExcelColumns<T>()
	{
		return typeof(T).GetProperties()
			.Where(p =>
			{
				DisplayAttribute[] displayAttributes =
					(DisplayAttribute[])p.GetCustomAttributes(typeof(DisplayAttribute), false);
				return displayAttributes.Length == 0
					|| displayAttributes[0].GetAutoGenerateField() != false;
			})
			.ToArray();
	}

	/// <summary>
	/// Uses the attribute to determine how to format the value
	/// </summary>
	/// <param name="value">The value to format</param>
	/// <param name="attribute">The attribute to use to format the value</param>
	/// <returns>The formatted value</returns>
	private static object FormatCellValue(object value, Attribute attribute)
	{
		// Format negative currency values as "-$123.45" instead of "($123.45)"
		string cultureString = System.Threading.Thread.CurrentThread.CurrentCulture.ToString();
		System.Globalization.NumberFormatInfo currencyFormat =
			new System.Globalization.CultureInfo(cultureString).NumberFormat;
		currencyFormat.CurrencyNegativePattern = 1;

		if (attribute is DisplayFormatAttribute dfAttribute
						&& dfAttribute.DataFormatString != null)
			return string.Format(currencyFormat, dfAttribute.DataFormatString, value);
		// AutoFitColumns sets the column too narrow if this is formatted as an actual date
		//  So use a string instead
		else if (value is DateTime dtValue)
			return dtValue.ToString("g");

		return value;
	}

	#endregion

	#region Fill from DataTable

	/// <summary>
	/// Fill an Excel sheet with a title, column headers, and data.
	/// </summary>
	/// <param name="worksheet">The worksheet to fill with data</param>
	/// <param name="title">The title to put at the top of the worksheet</param>
	/// <param name="data">The data to use to fill the worksheet</param>
	/// <returns>
	/// The <paramref name="worksheet"/>. This is mutable - returning it only helps with
	/// chaining.
	/// </returns>
	public static ExcelWorksheet FillReport(this ExcelWorksheet worksheet, DataTable data,
		string title)
	{
		// Format negative currency values as "-$123.45" instead of "($123.45)"
		string cultureString = System.Threading.Thread.CurrentThread.CurrentCulture.ToString();
		System.Globalization.NumberFormatInfo currencyFormat = new System.Globalization.CultureInfo(cultureString).NumberFormat;
		currencyFormat.CurrencyNegativePattern = 1;

		//set our printer settings....
		worksheet.PrinterSettings.Orientation = eOrientation.Landscape;
		//workSheet.PrinterSettings.FitToPage = true;
		//workSheet.PrinterSettings.FitToHeight = 0;
		worksheet.PrinterSettings.BottomMargin = .5m;
		worksheet.PrinterSettings.LeftMargin = .5m;
		worksheet.PrinterSettings.RightMargin = .5m;
		worksheet.PrinterSettings.TopMargin = .5m;

		// Set the report title in the first row
		using (ExcelRange cells = worksheet.Cells[1, 1, 1, data.Columns.Count])
		{
			cells.Merge = true;
			cells.Value = title;
			cells.Style.Font.Bold = true;
			cells.Style.Font.Size = 12;
			cells.Style.HorizontalAlignment = ExcelHorizontalAlignment.Left;
		}

		worksheet
			.InsertColumnHeaders(data, 2)
			.InsertData(data, 3);

		worksheet.Cells[worksheet.Dimension.Address].AutoFitColumns();
		return worksheet;
	}

	/// <summary>
	/// Fill out the column headers using the <paramref name="data"/>'s column titles
	/// </summary>
	/// <param name="worksheet">The worksheet to add the column headers to</param>
	/// <param name="data">The DataTable to get the column titles from</param>
	/// <param name="columnHeaderRow">The row to insert the column headers in</param>
	/// <returns>
	/// The <paramref name="worksheet"/>. This is mutable - returning it only helps with
	/// chaining.
	/// </returns>
	public static ExcelWorksheet InsertColumnHeaders(this ExcelWorksheet worksheet,
		DataTable data, int columnHeaderRow = 1)
	{
		worksheet.Row(columnHeaderRow).Style.Font.Bold = true;

		int currentColumn = 1;
		foreach (DataColumn dc in data.Columns)
		{
			worksheet.Cells[columnHeaderRow, currentColumn].Value = dc.ColumnName;
			currentColumn++;
		}

		return worksheet;
	}

	/// <summary>
	/// Insert data from a DataTable beginning at the given <paramref name="startRow"/>
	/// </summary>
	/// <param name="worksheet">The worksheet to fill</param>
	/// <param name="data">The data to fill the worksheet with</param>
	/// <param name="startRow">The row to begin filling the worksheet at. ONE INDEXED.</param>
	/// <returns>
	/// The <paramref name="worksheet"/>. This is mutable - returning it only helps with
	/// chaining.
	/// </returns>
	public static ExcelWorksheet InsertData(this ExcelWorksheet worksheet, DataTable data,
		int startRow = 1)
	{
		int currentRow = startRow;
		foreach (DataRow dr in data.Rows)
		{
			int currentColumn = 1;
			foreach (object value in dr.ItemArray)
			{
				ExcelRange cell = worksheet.Cells[currentRow, currentColumn];
				cell.Style.HorizontalAlignment = ExcelHorizontalAlignment.Left;

				cell.Value = FormatCellValue(value);
				currentColumn++;
			}

			currentRow++;
		}

		return worksheet;
	}

	/// <summary>
	/// Handles formatting the given value
	/// </summary>
	/// <param name="value"></param>
	/// <returns>The value converted to a cleaner type</returns>
	public static object FormatCellValue(object value)
	{
		// Some non-text values are stored as strings, convert them to their real type
		if (value is string strValue)
		{
			if (int.TryParse(strValue, out int intValue))
				return intValue;
			else if (decimal.TryParse(strValue, out decimal decimalValue))
				return decimalValue;
			else if (value.ToString().ToUpper() == true.ToString().ToUpper())
				return 1;
			else if (value.ToString().ToUpper() == false.ToString().ToUpper())
				return 0;
			else
				return value;
		}
		else if (value is bool boolValue)
			return boolValue ? 1 : 0;
		else
			return value.ToString();
	}

	#endregion
}
```
