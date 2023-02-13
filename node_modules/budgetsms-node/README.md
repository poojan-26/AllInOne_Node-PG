# budgetSMS-node
A wrapper for budgetSMS for use with NodeJS.

## Setup

```bash
npm i budgetsms-node
```

## How to use

### Initialize

```javascript
const BudgetSMS = new BudgetSMSAPI({
    username: process.env.BUDGET_SMS_USERNAME,
    userid: process.env.BUDGET_SMS_USER_ID,
    handle: process.env.BUDGET_SMS_HANDLE
})
```
### Send SMS

```javascript
BudgetSMS.from('InfoSMS')
  .to('123456789')
  .message('Hello world')
  .send()
  .then(json => console.log(json))
  .catch(error => console.error(error))
```

## For testing your solution use `test` instead

```javascript
BudgetSMS.from('InfoSMS')
  .to('123456789')
  .message('Hello world')
  .test()
  .then(json => console.log(json))
  .catch(error => console.error(error))
```

## Error codes

You can use this [page](https://www.budgetsms.net/sms-http-api/error-code/) for the meaning of the various error codes.
