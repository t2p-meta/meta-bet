
# planet2nd

> v1.0.0

Base URLs:

* <a href="http://192.168.50.141:20004">Api-192.168.50.141-20004: http://192.168.50.141:20004</a>

# fc-user-controller

<a id="opIdregisterAndLoginUsingPOST"></a>

## POST H5用户邮箱注册或登录

POST /meta/user/registerAndLogin

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|code|query|string| 否 |验证码|
|confirmPwd|query|string| 否 |确认密码（默认=pwd）|
|guid|query|string| 否 |可为空|
|inviteCode|query|string| 否 |默认0|
|loginType|query|string| 否 |默认：'P'|
|mail|query|string| 否 |邮箱|
|nickname|query|string| 否 |昵称|
|pwd|query|string| 否 |密码|
|signature|query|string| 否 |邮箱验证码返回签名：signature|
|v|query|string| 否 |微信兑奖券加密md5参数|

> 返回示例

> 200 Response

```json
{
    "errno": 0,
    "data": {
        "prizeMsg": "1 award",
        "selfCode": "binhdv",
        "user": {
            "id": 24,
            "deleted": false,
            "createTime": 1655981800,
            "updateTime": 1655981800,
            "nickname": "Jamilah_hGnn",
            "address": "",
            "mail": "wbyn2008@qq.com",
            "loginType": "P",
            "lastLoginTime": 1655981800,
            "lastLoginIp": "127.0.0.1",
            "userVerify": 0,
            "userCode": "222262116159062016",
            "uuid": "5369b5e9-7882-43eb-bb77-6f1d4f4dd37c",
            "bannerUrl": "",
            "isWeb": true,
            "role": "user",
            "selfCode": "x3qpsn",
            "inviteCode": "z9wrpx1"
        },
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJUaGlzIGlzIE1ldGEgTkZUIHRva2VuIiwiYXVkIjoiREFQUENIQUlOIiwidXNlcl9pZCI6IjI0IiwiaXNzIjoiTWV0YSIsImV4cCI6MTY2OTE5NTM4OCwiaWF0IjoxNjY5MTg4MTg4fQ.0M0a07RX8FYkJEACzJ3UdwrMSZM1Vd8SsAI6ZCsxchk"
    },
    "errmsg": "Success"
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|Created|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden|Inline|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|Not Found|Inline|

### 返回数据结构

<a id="opIdsendCodeUsingPOST"></a>

## POST 用户邮箱发送验证码

POST /meta/user/sendcode

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|mail|query|string| 否 |mail|

> 返回示例

> 200 Response

```json
{
    "errno": 0,
    "data": {
        "signature": "61ac269359c442d08bcbd7a96396a000"
    },
    "errmsg": "Success"
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|Created|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized|Inline|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|Forbidden|Inline|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|Not Found|Inline|

### 返回数据结构

# 数据模型

