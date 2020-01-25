using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.Text;
using System.Threading.Tasks;
using Xrm.Oss.FluentQuery;

namespace D365.Kanban.Plugins
{

    [DataContract]
    public class CreateNotificationConfig
    {
        [DataMember(Name = "parentLookupName")]
        public string ParentLookupName { get; set; }

        [DataMember(Name = "subscriptionLookupName")]
        public string SubscriptionLookupName { get; set; }

        [DataMember(Name = "notificationLookupName")]
        public string NotificationLookupName { get; set; }

        [DataMember(Name = "notifyCurrentUser")]
        public bool NotifyCurrentUser { get; set; }
    }
    
    public enum EventType {
        Update = 863910000,
        Create = 863910001,
        Assign = 863910002,
        Delete = 863910003,
        UserMention = 863910004
    }

    public class CreateNotification : IPlugin
    {
        private readonly string unsecureConfig;
        private readonly string secureConfig;
        private readonly CreateNotificationConfig config;

        public CreateNotification(string unsecure, string secure)
        {
            unsecureConfig = unsecure;
            secureConfig = secure;

            config = JsonDeserializer.Parse<CreateNotificationConfig>(unsecure);
        }

        public Entity GetTarget(IPluginExecutionContext context)
        {
            if (context.InputParameters.ContainsKey("Target"))
            {
                return context.InputParameters["Target"] as Entity;
            }

            return null;
        }

        public EntityReference GetTargetRef(IPluginExecutionContext context)
        {
            if (context.InputParameters.ContainsKey("Target"))
            {
                return context.InputParameters["Target"] as EntityReference;
            }

            return null;
        }

        public EventType GetEventType(IPluginExecutionContext context)
        {
            switch (context.MessageName.ToLowerInvariant())
            {
                case "create":
                    return EventType.Create;
                case "update":
                    return EventType.Update;
                case "assign":
                    return EventType.Assign;
                case "delete":
                    return EventType.Delete;
                default:
                    return EventType.UserMention;
            }
        }

        public void Execute(IServiceProvider serviceProvider)
        {
            var context = serviceProvider.GetService(typeof(IPluginExecutionContext)) as IPluginExecutionContext;
            var crmTracing = serviceProvider.GetService(typeof(ITracingService)) as ITracingService;
            var serviceFactory = serviceProvider.GetService(typeof(IOrganizationServiceFactory)) as IOrganizationServiceFactory;
            var service = serviceFactory.CreateOrganizationService(null);

            var target = GetTarget(context);
            var targetRef = GetTargetRef(context);

            if (target == null && targetRef == null)
            {
                return;
            }

            var attributes = target != null ? target.Attributes.Keys.ToList() : null;

            var eventData = new EventData
            {
                UpdatedFields = attributes,
                EventRecordReference = target?.ToEntityReference() ?? targetRef
            };

            var parent = string.IsNullOrEmpty(config.ParentLookupName) ? eventData.EventRecordReference : context.PreEntityImages.Values.Select(p => p.GetAttributeValue<EntityReference>(config.ParentLookupName)).FirstOrDefault(e => e != null);

            if (parent == null) {
                crmTracing.Trace("Failed to find parent, exiting");
                return;
            }

            var subscriptionsQuery = service.Query("oss_subscription")
                .Where(e => e
                    .Attribute(a => a
                        .Named(config.SubscriptionLookupName)
                        .Is(ConditionOperator.Equal)
                        .To(eventData.EventRecordReference.Id)
                    )
                    .Attribute(a => a
                        .Named("statecode")
                        .Is(ConditionOperator.Equal)
                        .To(0)
                    )
                )
                .IncludeColumns("ownerid");

            if (!config.NotifyCurrentUser) {
                subscriptionsQuery.AddCondition(
                    (a => a
                        .Named("ownerid")
                        .Is(ConditionOperator.NotEqual)
                        .To(context.UserId)
                    )
                );
            }
                
            var subscriptions = subscriptionsQuery.RetrieveAll();

            var serializedNotification = JsonSerializer.Serialize(eventData);
            var eventType = GetEventType(context);

            subscriptions.ForEach(subscription => {
                var notification = new Entity
                {
                    LogicalName = "oss_notification",
                    Attributes = {
                        ["ownerid"] = subscription.GetAttributeValue<EntityReference>("ownerid"),
                        ["oss_event"] = new OptionSetValue((int) eventType),
                        [config.NotificationLookupName] = parent,
                        ["oss_data"] = serializedNotification
                    }
                };

                service.Create(notification);
            });
        }
    }
}
