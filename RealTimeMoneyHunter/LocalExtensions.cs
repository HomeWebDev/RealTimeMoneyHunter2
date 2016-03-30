using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MoveShapeDemo
{
    public static class LocalExtensions
    {
        public static bool ReturnFreeId(this ConcurrentDictionary<string, ShapeModel> dir, out int FreeNumber)
        {
            if (dir.Count == 0)
            {
                FreeNumber = 1;
                return true;
            }
            int count = 1;

            foreach (var item in dir.Values.OrderBy(x => x.PlayerId).ToList())
            {
                if (item.PlayerId.Trim("player".ToCharArray()) != count.ToString())
                {
                    FreeNumber = count;
                    return true;
                }
                count++;
            }

            FreeNumber = dir.Count + 1;
            return false;
        }
    }
}