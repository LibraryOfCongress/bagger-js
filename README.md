# bagger-js [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](README.md#contributor-guidelines)

An experiment with a pure JavaScript implementation of the BagIt specification
and a simple web application which allows bagging and transferring local content

## Major Features

* [x] File drag and drop or selection
* [x] [Recursive directory drag and drop or selection](https://github.com/loc-rdc/bagger-js/pull/1) (currently supported only in Chrome; see #1)
* [x] Incremental hashing
* [x] Multi-threading
* [x] Uploads to S3
* [ ] Ability to resume interrupted transfers
* [ ] Ability to download the generated bag rather than individual files
* [ ] [Ability to edit bag info fields](https://github.com/LibraryOfCongress/bagger-js/issues/13)

## Quickstart

### Configure your S3 test bucket

The two key parts are having a working
[CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) configuration
attached to the bucket and a policy attached to the IAM user granting enough
access to upload files. 

This CORS configuration is known to work as of June 2018:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<CORSConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
<CORSRule>
    <AllowedOrigin>*</AllowedOrigin>
    <AllowedMethod>PUT</AllowedMethod>
    <AllowedMethod>POST</AllowedMethod>
    <AllowedMethod>DELETE</AllowedMethod>
    <AllowedMethod>GET</AllowedMethod>
    <AllowedMethod>HEAD</AllowedMethod>
    <AllowedHeader>*</AllowedHeader>
    <AllowedHeader>authorization</AllowedHeader>
    <AllowedHeader>content-type</AllowedHeader>
    <AllowedHeader>x-amz-date</AllowedHeader>
    <AllowedHeader>x-amz-user-agent</AllowedHeader>
    <ExposeHeader>ETag</ExposeHeader>
    <ExposeHeader>x-amz-server-side-encryption</ExposeHeader>
    <ExposeHeader>x-amz-request-id</ExposeHeader>
    <ExposeHeader>x-amz-id-2</ExposeHeader>
</CORSRule>
</CORSConfiguration>
```

This IAM policy is known to work as of June 2018, but note the hard-coded
bucket name which you'll need to change:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowListingAllBuckets",
            "Effect": "Allow",
            "Action": "s3:ListAllMyBuckets",
            "Resource": "*"
        },
        {
            "Sid": "AllowWritingToSelectedBucket",
            "Effect": "Allow",
            "Action": [
                "s3:CreateBucket",
                "s3:HeadBucket",
                "s3:DeleteObject",
                "s3:ListMultipartUploadParts",
                "s3:PutObject",
                "s3:GetObject",
                "s3:ListBucket",
                "s3:AbortMultipartUpload",
                "s3:ListBucketMultipartUploads",
                "s3:GetBucketCORS",
                "s3:GetBucketLocation",
                "s3:GetObjectVersion"
            ],
            "Resource": [
                "arn:aws:s3:::your-test-bucket/*",
                "arn:aws:s3:::your-test-bucket"
            ]
        }
    ]
}
```

### Running Bagger JS

#. Open index.html in a browser

## Contributor Guidelines

All code should be formatted using Prettier and pass ESLint using the provided
configuration
