using Microsoft.Xrm.Sdk;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.Text;
using System.Threading.Tasks;

namespace Xrm.Oss.PowerKanban
{
    [DataContract]
    public class EventData
    {
        [DataMember(Name = "updatedFields")]
        public List<string> UpdatedFields { get; set; }

        [DataMember(Name = "eventRecordReference")]
        public EntityReference EventRecordReference { get; set; }
    }
}
