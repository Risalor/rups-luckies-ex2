using System;
using System.Collections.Generic;
using System.Globalization;
using UnityEngine;
using System.Linq;

public enum LookDirection
{
    Up,
    Down,
    Right,
    Left
}

public static class Misc
{
    public static void SmartLog(this UnityEngine.Object sender, string message, LogType type = LogType.Log, params string[] tags)
    {
        string name = sender ? sender.GetType().Name : "Unknown";

        if (tags.Length > 0)
        {
            string prefix = "[";
            foreach (string tag in tags)
                prefix += $" {tag}";
            prefix += " ] ";
            message = prefix + message;
        }

        Debug.unityLogger.Log(logType: type, tag: name, message: message, context: sender);
    }

    #region FORMATTING
    public static string FormatNumber(double number, List<string> suffixes)
    {
        number = Math.Abs(number);

        int suffixIndex = 0;
        int count = suffixes.Count;
        while (number >= 1000 && suffixIndex < count)
        {
            number /= 1000;
            suffixIndex++;
        }

        number = Math.Truncate(number * 100) / 100;
        if (suffixIndex == 0)
            number = Math.Floor(number);

        return number.ToString(CultureInfo.InvariantCulture) + suffixes[suffixIndex];
    }

    public static double RoundToDecimalPlaces(double number, uint decimalPlaces)
    {
        double multiplier = Math.Pow(10, decimalPlaces);
        return Math.Round(number * multiplier) / multiplier;
    }

    public static string FormatNumber(double number, uint decimalPlaces = 0)
    {
        number = RoundToDecimalPlaces(number, decimalPlaces);

        var ni = new CultureInfo(CultureInfo.CurrentCulture.Name).NumberFormat;
        ni.NumberDecimalDigits = 0;
        ni.NumberGroupSeparator = " ";
        ni.NumberGroupSizes = new int[] { 3 };

        return number.ToString(ni);
    }

    public static string FormatFieldName(string rawName)
    {
        if (string.IsNullOrWhiteSpace(rawName))
            return string.Empty;

        string formatted = rawName.StartsWith("_") ? rawName.Substring(1) : rawName;
        formatted = System.Text.RegularExpressions.Regex.Replace(formatted, "(\\B[A-Z])", " $1");

        return char.ToUpper(formatted[0]) + formatted.Substring(1).Trim();
    }
    #endregion

    public static T FindClosest2D<T>(Vector3 position, List<T> source) where T : MonoBehaviour
    {
        float closestDistance = Mathf.Infinity;
        T result = null;
        foreach (T item in source)
        {
            float distance = ((Vector2)(item.transform.position - position)).sqrMagnitude;
            if (distance < closestDistance)
            {
                closestDistance = distance;
                result = item;
            }
        }

        return result;
    }

    public static T FindClosest3D<T>(Vector3 position, List<T> source) where T : MonoBehaviour
    {
        float closestDistance = Mathf.Infinity;
        T result = null;
        foreach (T item in source)
        {
            float distance = (item.transform.position - position).sqrMagnitude;
            if (distance < closestDistance)
            {
                closestDistance = distance;
                result = item;
            }
        }

        return result;
    }

    #region LIST & ARRAY HELPERS
    /// <summary>
    /// Returns a random element from the given list.
    /// </summary>
    public static T GetRandom<T>(this List<T> list)
    {
        if (list == null || list.Count == 0)
            throw new ArgumentException("List is null or empty", nameof(list));

        return list[UnityEngine.Random.Range(0, list.Count)];
    }

    /// <summary>
    /// Returns a random element from the given array.
    /// </summary>
    public static T GetRandom<T>(this T[] array)
    {
        if (array == null || array.Length == 0)
            throw new ArgumentException("Array is null or empty", nameof(array));

        return array[UnityEngine.Random.Range(0, array.Length)];
    }

    public static void Shuffle<T>(this IList<T> list)
    {
        System.Random rnd = new System.Random();
        for (var i = 0; i < list.Count; i++)
            list.Swap(i, rnd.Next(i, list.Count));
    }

    public static void Swap<T>(this IList<T> list, int i, int j)
    {
        var temp = list[i];
        list[i] = list[j];
        list[j] = temp;
    }
    #endregion

    public static void LookAt2D(this Transform transform, Vector2 target, LookDirection direction)
    {
        Vector2 dir = target - (Vector2)transform.position;

        switch (direction)
        {
            case LookDirection.Up:
                transform.up = dir;
                break;
            case LookDirection.Down:
                transform.up = -dir;
                break;
            case LookDirection.Right:
                transform.right = dir;
                break;
            case LookDirection.Left:
                transform.right = -dir;
                break;
        }
    }

    public static List<T> GetEnumValues<T>() where T : Enum
    {
        return Enum.GetValues(typeof(T)).Cast<T>().ToList();
    }

    public static T GetRandomEnumValue<T>() where T : Enum
    {
        return GetEnumValues<T>().OrderBy(x => UnityEngine.Random.value).First();
    }

    public static string ToTime(float timeInSeconds, bool showHours = false)
    {
        TimeSpan t = TimeSpan.FromSeconds(timeInSeconds);
        if (showHours)
        {
            return t.ToString(@"hh\:mm\:ss");
        } else
        {
            return t.ToString(@"mm\:ss");
        }
    }

    public static Vector3 RandomizePosition(Vector3 center, float min, float max)
    {
        float angle = UnityEngine.Random.Range(0.0f, Mathf.PI * 2);
        return center + new Vector3(Mathf.Sin(angle), Mathf.Cos(angle), 0) * UnityEngine.Random.Range(min, max);
    }

    #region 3D Geometry

    public static List<Vector3> GetEvenlyDistributedPointsOnCircle(float radius, int numPoints, float scaleX, float scaleZ, Vector3 center)
    {
        List<Vector3> result = new List<Vector3>();
        float angle = 360f / numPoints;

        for (int i = 0; i < numPoints; i++)
            result.Add(GetPointOnCircle(radius, angle * i, scaleX, scaleZ, center));

        return result;
    }

    public static Vector3 GetRandomPointWithinCircle(float radius, float scaleX, float scaleZ, Vector3 center) => GetRandomPointWithinDonut(0f, radius, scaleX, scaleZ, center);
    public static Vector3 GetRandomPointWithinDonut(float minRadius, float maxRadius, float scaleX, float scaleZ, Vector3 center) => GetRandomPointWithinPartialDonut(minRadius, maxRadius, 0, 360, scaleX, scaleZ, center);
    public static Vector3 GetPointOnCircle(float radius, float angle, float scaleX, float scaleZ, Vector3 center) => GetRandomPointOnPartialCircle(radius, angle, angle, scaleX, scaleZ, center);
    public static Vector3 GetRandomPointOnCircle(float radius, float scaleX, float scaleZ, Vector3 center) => GetRandomPointOnPartialCircle(radius, 0f, 360f, scaleX, scaleZ, center);
    public static Vector3 GetRandomPointOnPartialCircle(float radius, float minAngle, float maxAngle, float scaleX, float scaleZ, Vector3 center) => GetRandomPointWithinPartialDonut(radius, radius, minAngle, maxAngle, scaleX, scaleZ, center);

    public static Vector3 GetRandomPointWithinPartialDonut(float minRadius, float maxRadius, float minAngle, float maxAngle, float scaleX, float scaleZ, Vector3 center)
    {
        float angle = UnityEngine.Random.Range(minAngle, maxAngle) * Mathf.Deg2Rad;
        float radius = UnityEngine.Random.Range(minRadius, maxRadius);

        float x = Mathf.Cos(angle) * radius * scaleX;
        float z = Mathf.Sin(angle) * radius * scaleZ;

        return new Vector3(center.x + x, center.y, center.z + z);
    }

    #endregion

    #region 2D Geometry

    public static List<Vector2> GetEvenlyDistributedPointsOnCircle2D(float radius, int numPoints, float scaleX, float scaleY, Vector2 center)
    {
        List<Vector2> result = new List<Vector2>();
        float angle = 360f / numPoints;

        for (int i = 0; i < numPoints; i++)
            result.Add(GetPointOnCircle2D(radius, angle * i, scaleX, scaleY, center));

        return result;
    }

    public static Vector2 GetPointOnCircle2D(float radius, float angle, float scaleX, float scaleY, Vector2 center) => GetRandomPointOnPartialCircle2D(radius, angle, angle, scaleX, scaleY, center);
    public static Vector2 GetRandomPointOnCircle2D(float radius, float scaleX, float scaleY, Vector2 center) => GetRandomPointOnPartialCircle2D(radius, 0f, 360f, scaleX, scaleY, center);
    public static Vector2 GetRandomPointOnPartialCircle2D(float radius, float minAngle, float maxAngle, float scaleX, float scaleY, Vector2 center) => GetRandomPointWithinPartialDonut2D(radius, radius, minAngle, maxAngle, scaleX, scaleY, center);

    public static Vector2 GetRandomPointWithinPartialDonut2D(float minRadius, float maxRadius, float minAngle, float maxAngle, float scaleX, float scaleY, Vector2 center)
    {
        float angle = UnityEngine.Random.Range(minAngle, maxAngle) * Mathf.Deg2Rad;
        float radius = UnityEngine.Random.Range(minRadius, maxRadius);

        float x = Mathf.Cos(angle) * radius * scaleX;
        float y = Mathf.Sin(angle) * radius * scaleY;

        return new Vector2(center.x + x, center.y + y);
    }

    #endregion
}
