using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.Serialization.Json;
using System.Text;
using System.Threading.Tasks;

namespace Xrm.Oss.PowerKanban
{
    public static class JsonDeserializer
    {
        public static T Parse<T>(string json) where T : class
        {
            if (string.IsNullOrEmpty(json))
            {
                return default(T);
            }

            using (var memoryStream = new MemoryStream(Encoding.UTF8.GetBytes(json)))
            {
                var serializer = new DataContractJsonSerializer(typeof(T));

                var config = serializer.ReadObject(memoryStream);

                return config as T;
            }
        }
    }
}
