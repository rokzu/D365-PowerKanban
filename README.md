# D365 Power Kanban

This is a custom PCF control for displaying a Kanban inside D365 datasets.

Features so far:
- Supports option sets, status codes and boolean attributes as swimlane sources
- Color schemes are taken from option set color values
- Primary and Secondary entities can be configured, so that you can show accounts and their child cases in one kanban board (choose view Advanced)
- Swimlanes with Drag and Drop functionality (allowed transitions can be defined for statuscode attributes inside their respective state transitions, or via custom script hook)
- Card forms can be used for customizing the display, they are rendered with clickable lookups
- Side-By-Side view for quick data view AND edit, where all your form scripts are considered (resizable in lower right corner)
- Custom Buttons and Custom Forms on state transition (via custom script support)
- Search in data, highlighting and filtering
- Support for subscriptions and notifications to records, so that you can subscribe to record changes and see them
- Custom Dialogs, for allowing to also resolve cases, win opportunities etc from the board

Todos:
- Virtualization and Performance Tweaking
- Plugins for automatically creating notifications for subscribed users are already done, need to change namespace
- Pay respect to dataset data, we are only using views currently

# Impressions
## Advanced View
![Screenshot_2020-06-23 Accounts My Active Accounts - Microsoft Dynamics 365](https://user-images.githubusercontent.com/4287938/85366990-adf42780-b528-11ea-8848-bc035b21ae4f.png)

## Custom Dialogs
![Screenshot_2020-06-23 Accounts My Active Accounts - Microsoft Dynamics 365(1)](https://user-images.githubusercontent.com/4287938/85367031-c2382480-b528-11ea-9864-c0b36f0e6e00.png)

## Side By Side View
![Screenshot_2020-06-23 Accounts My Active Accounts - Microsoft Dynamics 365(2)](https://user-images.githubusercontent.com/4287938/85367151-fdd2ee80-b528-11ea-9765-bd3a80337fcb.png)
