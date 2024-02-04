
# codeweb

a web based code editor for developing frontend websites. you can write html, css, javascript and view the resualt at the same time
and also you can share your work with others

***

# Resources

[Model link](https://app.eraser.io/workspace/VRNED9NfNXsJeNhSgz4m?origin=share)

***
# About this project

This project is a complex backend project that is built with nodejs, expressjs, mongodb, mongoose, jwt, bcrypt, nodemailer, and many more. This project is a complete backend project that has all the features that a backend project should have.

I build a complete online code editing and publishing web app similar to codepen with all the features like login, signup, create new project(web), like, dislike, comment, reply, follow, unfollow, upload assets(image, video, audio, and others) and many more.

## Key features for users
1. signup (create new user)
2. login
3. logout
4. get current logedin user
5. email verification
6. send welcome email
7. forgot password
8. reset password
9. update user info
10. delete user

## Key features for webs(projects)
1. create new web
2. get all webs
3. get single web
4. update web
5. delete web
6. like web
7. dislike web
8. comment on web
9. reply on comment
10. delete comment
11. delete reply

## Key features for assets
1. upload assets
2. get all assets
3. get single asset
4. update asset
5. delete asset

## Key features for followers
1. follow user
2. unfollow user
3. get all followers
4. get all followings

---

# How to use this project in your frontend web app or mobile app

if you want to use this project in your frontend web app or mobile app then you can follow this documentation.

in this documentation I use axios to make http request to the backend server. so if you want to use this project in your frontend web app or mobile app then you can use axios to make http request to the backend server or you can use any other library to make http request to the backend server.

## user routes

### create new user

```js
function createNewUser({username,email,password,fullName,verificationURL=""}) {
    const data = {
        username,
        email,
        password,
        fullName,
        verificationURL // redirect url for email verification
    }
    axios.post("https://codeweb.onrender.com/api/v1/users/register", data)
        .then(res => {
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })
}
```

### login

```js
function login({identifier,password}) {
    const data = {
        identifier, // username or email
        password
    }
    axios.post("https://codeweb.onrender.com/api/v1/users/login", data)
        .then(res => {
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })
}
```

### logout

```js
function logout() {
    axios.post("https://codeweb.onrender.com/api/v1/users/logout?fromAllDevices=true")
    // fromAllDevices=true means logout from all devices if you want to logout from current device then remove this query parameter
        .then(res => {
            // only possible if you already logged in
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })
}
```

### refresh access token

```js
function refreshAccessToken() {
    axios.post("https://codeweb.onrender.com/api/v1/users/refresh-token")
        .then(res => {
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })
}
```

### get current logedin user

```js
function getCurrentUser() {
    axios.get("https://codeweb.onrender.com/api/v1/users/me")
        .then(res => {
            // only possible if you already logged in
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })
}
```

### request verify email

```js
function requestVerifyEmail({verificationURL=""}) {
    axios.post("https://codeweb.onrender.com/api/v1/users/request-verify-email",{verificationURL})
        .then(res => {
            // only possible if you already logged in
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })
}
```

### verify email

```js
function verifyEmail({token}) {
    axios.post("https://codeweb.onrender.com/api/v1/users/verify-email",{token})
        .then(res => {
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })
}
```

### request forgot password email

```js
function sendForgotPasswordEmail({email,resetPasswordURL=""}) {
    axios.post("https://codeweb.onrender.com/api/v1/users/request-forgot-password-email",{email,resetPasswordURL})
        .then(res => {
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })
}
```

### reset password

```js
function resetPassword({token,newPassword}) {
    axios.post("https://codeweb.onrender.com/api/v1/users/reset-password",{token,newPassword})
        .then(res => {
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })
}
```

### update user info

```js
function updateUserInfo(data) {
    // data = {fullName,bio,link1,link2,link3}
    axios.patch("https://codeweb.onrender.com/api/v1/users/update",{...data})
        .then(res => {
            // only possible if you already logged in
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })
}
```

### change password

```js
function changePassword({oldPassword,newPassword}) {
    axios.post("https://codeweb.onrender.com/api/v1/users/change-password",{oldPassword,newPassword})
        .then(res => {
            // only possible if you already logged in
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })
}
```

### change email

```js
function changeEmail({email,password,verificationURL}) {
    axios.post("https://codeweb.onrender.com/api/v1/users/change-email",{email,password,verificationURL})
        .then(res => {
            // only possible if you already logged in
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })
}
```

### delete user

```js
function deleteUser({password}) {
    axios.delete("https://codeweb.onrender.com/api/v1/users/delete",{password})
        .then(res => {
            // only possible if you already logged in
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })
}
```

### update avatar

```js
function updateAvatar({image,public_id}) {
    // avatar = avatar url
    axios.patch("https://codeweb.onrender.com/api/v1/users/update-avatar",{image,public_id})
        .then(res => {
            // only possible if you already logged in
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })
}
```

### update cover image

```js
function updateCoverImage({image,public_id}) {
    // coverImage = cover image url
    axios.patch("https://codeweb.onrender.com/api/v1/users/update-cover-image",{image,public_id})
        .then(res => {
            // only possible if you already logged in
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })
}
```

### get user profile

```js
function getUserProfile({username}) {
    axios.get(`https://codeweb.onrender.com/api/v1/users/profile/${username}`)
        .then(res => {
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })
}
```

### get showcaseItems

```js
function getShowcaseItems({username}) {
    axios.get(`https://codeweb.onrender.com/api/v1/users/showcase/${username}`)
        .then(res => {
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })
}
```

### get pined items

```js
function getPinedItems({page,limit}) {
    axios.get(`https://codeweb.onrender.com/api/v1/users/pined?page=${page}&limit=${limit}`)
        .then(res => {
            // only possible if you already logged in
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })
}
```

### add to pined items

```js
function addToPinedItems({webId}) {
    axios.patch(`https://codeweb.onrender.com/api/v1/users/add-to-pined/${webId}`)
        .then(res => {
            // only possible if you already logged in
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })
}
```

### remove from pined items

```js
function removeFromPinedItems({webId}) {
    axios.patch(`https://codeweb.onrender.com/api/v1/users/remove-pined/${webId}`)
        .then(res => {
            // only possible if you already logged in
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })
}
```

### update showcase

```js
function updateShowcase({showcase}) {
    axios.patch(`https://codeweb.onrender.com/api/v1/users/update-showcase`,{showcase})
        .then(res => {
            // only possible if you already logged in
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })
}
```

### check-username-availability

```js
function checkUsernameAvailability({username}) {
    axios.get(`https://codeweb.onrender.com/api/v1/users/check-username-availability/${username}`)
        .then(res => {
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })
}
```

### search-users

```js
function searchUsers({search,page=1,limit=6}) {
    axios.get(`https://codeweb.onrender.com/api/v1/users/search?search=${search}&page=${page}&limit=${limit}`)
        .then(res => {
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })
}
```

## web routes

### create new web

```js
function createWeb({title,description,html="",css="",js="",isPublic,image}) {
    const formData = new FormData();
      formData.append('image', image, 'my-image-name.jpeg');
      formData.append('title', title);
      formData.append('description', description);
        formData.append('html', html);
        formData.append('css', css);
        formData.append('js', js);
        formData.append('isPublic', isPublic);
    axios.post("https://codeweb.onrender.com/api/v1/webs/create",formData,{
        headers: {
          'Content-Type': 'multipart/form-data',
        },
    })
        .then(res => {
            // only possible if you already logged in
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })
}
```

### fork someone's web

```js
function forkWeb({webId}) {
    axios.post(`https://codeweb.onrender.com/api/v1/webs/create-forked/${webId}`)
        .then(res => {
            // only possible if you already logged in
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })
}

```

### get web by web id

```js
function getWebById({webId}) {
    axios.get(`https://codeweb.onrender.com/api/v1/webs/${webId}`)
        .then(res => {
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })
}
```

### get all webs by user id (created by user)

```js
function getAllWebByUserId ({userId,queryParameters="page=1&limit=4&webType=public"}) {
    // queryParameters = string contains all querys of url
    // valid querys are  webType , sortBy, sortOrder, page, limit;
    axios.get(`https://codeweb.onrender.com/api/v1/webs/user/${userId}?${queryParameters}`)
            .then(res => {
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })
}
```

### get all webs by user id (liked by user)

```js
function getAllWebByUserId ({userId,queryParameters="page=1&limit=4"}) {
    // queryParameters = string contains all querys of url
    // valid querys are sortBy, sortOrder, page, limit;
    axios.get(`https://codeweb.onrender.com/api/v1/webs/liked/${userId}?${queryParameters}`)
            .then(res => {
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })
}
```

### get my following users webs

```js
function getMyFollowingUsersWebs ({queryParameters="page=1&limit=4"}) {
    // queryParameters = string contains all querys of url
    // valid querys are sortBy, sortOrder, page, limit;
    axios.get(`https://codeweb.onrender.com/api/v1/webs/following?${queryParameters}`)
            .then(res => {
            // only possible if you already logged in
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })
}
```

### get trending webs

```js
function getTrendingWebs ({queryParameters="page=1&limit=4"}) {
    // queryParameters = string contains all querys of url
    // valid querys are page, limit;
    axios.get(`https://codeweb.onrender.com/api/v1/webs/trending?${queryParameters}`)
            .then(res => {
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })
}
```

### get your Work webs

```js
function getYourWorkWebs ({queryParameters="page=1&limit=4"}) {
    // queryParameters = string contains all querys of url
    // valid querys are sortBy, sortOrder, page, limit;
    axios.get(`https://codeweb.onrender.com/api/v1/webs/your-work?${queryParameters}`)
            .then(res => {
            // only possible if you already logged in
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })
}
```

### search from my webs

```js
function searchFromMyWebs ({queryParameters="page=1&limit=4"}) {
    // queryParameters = string contains all querys of url
    // valid querys are search, page, limit;
    axios.get(`https://codeweb.onrender.com/api/v1/webs/search/my-webs?${queryParameters}`)
            .then(res => {
            // only possible if you already logged in
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })
}
```

### show recomended peoples to follow

```js
function showRecomendedPeoplesToFollow ({queryParameters="page=1&limit=8"}) {
    // queryParameters = string contains all querys of url
    // valid querys are page, limit;
    axios.get(`https://codeweb.onrender.com/api/v1/webs/recomended-people?${queryParameters}`)
            .then(res => {
            // only possible if you already logged in
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })
}

```

### update web 

```js
function updateWeb ({webId,title,description,html,css,js,image}) {
    const formData = new FormData();
      formData.append('image', image, 'my-image-name.jpeg');
      formData.append('title', title);
      formData.append('description', description);
        if(html) formData.append('html', html);
        if(css) formData.append('css', css);
        if(js) formData.append('js', js);
    axios.patch(`https://codeweb.onrender.com/api/v1/webs/update/${webId}`,formData,{
        headers: {
          'Content-Type': 'multipart/form-data',
        },
    })
            .then(res => {
            // only possible if you already logged in
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })

}
```

### delete web

```js
function deleteWeb ({webId}) {
    axios.delete(`https://codeweb.onrender.com/api/v1/webs/delete/${webId}`)
            .then(res => {
            // only possible if you already logged in
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })

}
```

### toggle-publish-status of web

```js
function togglePublishStatus ({webId}) {
    axios.patch(`https://codeweb.onrender.com/api/v1/webs/toggle-publish-status/${webId}`)
            .then(res => {
            // only possible if you already logged in
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })
}
```

### increase views of web

```js
function increaseViews ({webId}) {
    axios.patch(`https://codeweb.onrender.com/api/v1/webs/inc-view/${webId}`)
            .then(res => {
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })
}
```

### search from all webs

```js
function searchFromAllWebs ({queryParameters="page=1&limit=4"}) {
    // queryParameters = string contains all querys of url
    // valid querys are search, page, limit;
    axios.get(`https://codeweb.onrender.com/api/v1/webs/search/all-webs?${queryParameters}`)
            .then(res => {
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })
}
```

## collection routes

### create new collection

```js
function createNewCollection ({name,description,isPublic=true}) {
    axios.post(`https://codeweb.onrender.com/api/v1/collections/create`,{name,description,isPublic=true})
            .then(res => {
            // only possible if you already logged in
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })

}
```

### update collection

```js
function updateCollection ({collectionId,name,description}) {
    axios.patch(`https://codeweb.onrender.com/api/v1/collections/update/${collectionId}`,{name,description})
            .then(res => {
            // only possible if you already logged in
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })

}
```

### delete collection

```js
function deleteCollection ({collectionId}) {
    axios.delete(`https://codeweb.onrender.com/api/v1/collections/delete/${collectionId}`)
            .then(res => {
            // only possible if you already logged in
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })

}
```

### add web to collection

```js
function addWebToCollection ({collectionId,webId}) {
    axios.patch(`https://codeweb.onrender.com/api/v1/collections/add-web/${collectionId}/${webId}`)
            .then(res => {
            // only possible if you already logged in
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })

}
```

### remove web from collection

```js
function removeWebFromCollection ({collectionId,webId}) {
    axios.patch(`https://codeweb.onrender.com/api/v1/collections/remove-web/${collectionId}/${webId}`)
            .then(res => {
            // only possible if you already logged in
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })

}
```

### toggle publish status of collection

```js
function togglePublishStatusOfCollection ({collectionId}) {
    axios.patch(`https://codeweb.onrender.com/api/v1/collections/toggle-publish-status/${collectionId}`)
            .then(res => {
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })

}
```

### increase views of collection

```js
function increaseViewsOfCollection ({collectionId}) {
    axios.patch(`https://codeweb.onrender.com/api/v1/collections/inc-view/${collectionId}`)
            .then(res => {
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })

}
```

### get collection by collection id

```js
function getCollectionByCollectionId ({collectionId}) {
    axios.get(`https://codeweb.onrender.com/api/v1/collections/get/${collectionId}`)
            .then(res => {
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })

}
```

### get collection webs by collection id

```js
function getCollectionWebsByCollectionId ({collectionId,queryParameters="page=1&limit=4"}) {
    // queryParameters = string contains all querys of url
    // valid querys are page, limit;
    axios.get(`https://codeweb.onrender.com/api/v1/collections/get-webs/${collectionId}?${queryParameters}`)
            .then(res => {
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })

}
```

### get all collections by user id

```js
function getAllCollectionsByUserId ({userId,queryParameters="page=1&limit=4&collectionType=public"}) {
    // queryParameters = string contains all querys of url
    // valid querys are page, limit , sortBy, sortOrder, collectionType;
    axios.get(`https://codeweb.onrender.com/api/v1/collections/user-collection/${userId}?${queryParameters}`)
            .then(res => {
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })

}
```

### get collections created by me

```js
function getCollectionsCreatedByUser ({queryParameters="page=1&limit=4"}) {
    // queryParameters = string contains all querys of url
    // valid querys are page, limit , sortBy, sortOrder;
    axios.get(`https://codeweb.onrender.com/api/v1/collections/my-collections?${queryParameters}`)
            .then(res => {
                // only possible if you already logged in
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })

}
```

### get liked collections by userId

```js
function getLikedCollectionsByUserId ({userId,queryParameters="page=1&limit=4"}) {
    // queryParameters = string contains all querys of url
    // valid querys are page, limit , sortBy, sortOrder;
    axios.get(`https://codeweb.onrender.com/api/v1/collections/liked/${userId}?${queryParameters}`)
            .then(res => {
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })

}
```

### search from all collections

```js
function searchFromAllCollections ({queryParameters="page=1&limit=4"}) {
    // queryParameters = string contains all querys of url
    // valid querys are search, page, limit;
    axios.get(`https://codeweb.onrender.com/api/v1/collections/search/all-collections?${queryParameters}`)
            .then(res => {
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })

}
```

### search from my collections

```js
function searchFromMyCollections ({queryParameters="page=1&limit=4"}) {
    // queryParameters = string contains all querys of url
    // valid querys are search, page, limit;
    axios.get(`https://codeweb.onrender.com/api/v1/collections/search/my-collections?${queryParameters}`)
            .then(res => {
                // only possible if you already logged in
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })

}
```

### check collection name availability

```js
function checkCollectionNameAvailability ({name}) {
    axios.get(`https://codeweb.onrender.com/api/v1/collections/check-name-availability/${name.replaceAll(" ","-")}`)
            .then(res => {
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })

}
```

## asset routes

### create new asset

```js
function createNewAsset ({title,assetType,assetURL,assetPublicId,isPublic=true}) {
    axios.post(`https://codeweb.onrender.com/api/v1/assets/create`,{title,assetType,assetURL,assetPublicId,isPublic})
            .then(res => {
            // only possible if you already logged in
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })

}

```

### get all assets created by me

```js
function getAllAssetsCreatedByMe ({queryParameters="page=1&limit=4"}) {
    // queryParameters = string contains all querys of url
    // valid querys are page, limit , assetType;
    axios.get(`https://codeweb.onrender.com/api/v1/assets/my-assets?${queryParameters}`)
            .then(res => {
                // only possible if you already logged in
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })

}
```

### get all public assets

```js
function getAllPublicAssets ({queryParameters="page=1&limit=4"}) {
    // queryParameters = string contains all querys of url
    // valid querys are page, limit , assetType;
    axios.get(`https://codeweb.onrender.com/api/v1/assets/get?${queryParameters}`)
            .then(res => {
                // only possible if you already logged in
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })

}
```

### search from all assets

```js
function searchFromAllAssets ({queryParameters="page=1&limit=4"}) {
    // queryParameters = string contains all querys of url
    // valid querys are search, page, limit, assetType;
    axios.get(`https://codeweb.onrender.com/api/v1/assets/search/all-assets?${queryParameters}`)
            .then(res => {
                // only possible if you already logged in
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })

}
```

### get asset by asset id

```js
function getAssetByAssetId ({assetId}) {
    axios.get(`https://codeweb.onrender.com/api/v1/assets/get/${assetId}`)
            .then(res => {
                // only possible if you already logged in
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })

}
```

### delete asset

```js
function deleteAsset ({assetId}) {
    axios.delete(`https://codeweb.onrender.com/api/v1/assets/delete/${assetId}`)
            .then(res => {
                // only possible if you already logged in
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })

}
```

### update asset

```js
function updateAsset ({assetId,title,isPublic=true}) {
    axios.patch(`https://codeweb.onrender.com/api/v1/assets/update/${assetId}`,{title,isPublic})
            .then(res => {
                // only possible if you already logged in
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })

}
```

### get assets liked by me

```js
function getAssetsLikedByMe ({queryParameters="page=1&limit=4"}) {
    // queryParameters = string contains all querys of url
    // valid querys are page, limit , assetType;
    axios.get(`https://codeweb.onrender.com/api/v1/assets/liked?${queryParameters}`)
            .then(res => {
                // only possible if you already logged in
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })

}
```

## comment routes

### create new comment

```js
function createNewComment ({web,text}) { // web = web id 
    axios.post(`https://codeweb.onrender.com/api/v1/comments/create`,{web,text})
            .then(res => {
                // only possible if you already logged in
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })
}
```

### update comment

```js
function updateComment ({commentId,text}) {
    axios.patch(`https://codeweb.onrender.com/api/v1/comments/update/${commentId}`,{text})
            .then(res => {
                // only possible if you already logged in
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })
}
```

### delete comment

```js
function deleteComment ({commentId}) {
    axios.delete(`https://codeweb.onrender.com/api/v1/comments/delete/${commentId}`)
            .then(res => {
                // only possible if you already logged in
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })
}
```

### get all comments by web id

```js
function getAllCommentsByWebId ({webId,queryParameters="page=1&limit=20"}) {
    // queryParameters = string contains all querys of url
    // valid querys are page, limit;
    axios.get(`https://codeweb.onrender.com/api/v1/comments/get-comments/${webId}?${queryParameters}`)
            .then(res => {
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })
}
```

### get comment by comment id

```js
function getCommentByCommentId ({commentId}) {
    axios.get(`https://codeweb.onrender.com/api/v1/comments/get/${commentId}`)
            .then(res => {
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })
}
```

## reply routes

### create new reply

```js
function createNewReply ({commentId,text}) { 
    axios.post(`https://codeweb.onrender.com/api/v1/replays/create`,{commentId,text}) // in my next project i will use replyTo
            .then(res => {
                // only possible if you already logged in
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })
}
```

### update reply

```js
function updateReply ({replayId,text}) {
    axios.patch(`https://codeweb.onrender.com/api/v1/replays/update/${replayId}`,{text})
    // it is my mistake i use replay instead of reply but i can't change it now because it will break my project
    // it is recommended to use reply instead of replay in frontend
            .then(res => {
                // only possible if you already logged in
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })
}
```

### delete reply

```js
function deleteReply ({replayId}) {
    axios.delete(`https://codeweb.onrender.com/api/v1/replays/delete/${replayId}`)
    // it is my mistake i use replay instead of reply but i can't change it now because it will break my project
    // it is recommended to use reply instead of replay in frontend
            .then(res => {
                // only possible if you already logged in
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })
}
```

## likes routes

### toggle like web

```js
function likeWeb ({webId}) {
    axios.post(`https://codeweb.onrender.com/api/v1/likes/web/${webId}`)
            .then(res => {
                // only possible if you already logged in
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })
}
```

### toggle like asset

```js
function likeAsset ({assetId}) {
    axios.post(`https://codeweb.onrender.com/api/v1/likes/asset/${assetId}`)
            .then(res => {
                // only possible if you already logged in
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })
}

```

### toggle like collection

```js
function likeCollection ({collectionId}) {
    axios.post(`https://codeweb.onrender.com/api/v1/likes/collection/${collectionId}`)
            .then(res => {
                // only possible if you already logged in
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })
}

```

### toggle like comment

```js
function likeComment ({commentId}) {
    axios.post(`https://codeweb.onrender.com/api/v1/likes/comment/${commentId}`)
            .then(res => {
                // only possible if you already logged in
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })
}

```

### toggle like reply

```js
function likeReply ({replayId}) {
    axios.post(`https://codeweb.onrender.com/api/v1/likes/replay/${replayId}`)
    // it is my mistake i use replay instead of reply but i can't change it now because it will break my project
    // it is recommended to use reply instead of replay in frontend
            .then(res => {
                // only possible if you already logged in
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })
}

```

## followers routes

### toggle follow unfollow user

```js
function toggleFollowUnfollowUser ({profileId}) {
    axios.post(`https://codeweb.onrender.com/api/v1/followers/toggle/${profileId}`)
            .then(res => {
                // only possible if you already logged in
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })
}

```

### get all followers by user id

```js
function getAllFollowersByUserId ({profileId,queryParameters="page=1&limit=20"}) {
    // queryParameters = string contains all querys of url
    // valid querys are page, limit;
    axios.get(`https://codeweb.onrender.com/api/v1/followers/get-followers/${profileId}?${queryParameters}`)
            .then(res => {
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })
}

```

### get all followings by user id

```js
function getAllFollowingsByUserId ({profileId,queryParameters="page=1&limit=20"}) {
    // queryParameters = string contains all querys of url
    // valid querys are page, limit;
    axios.get(`https://codeweb.onrender.com/api/v1/followers/get-followings/${profileId}?${queryParameters}`)
            .then(res => {
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })
}

```


## helth check route

```js
function helthCheck () {
    axios.get(`https://codeweb.onrender.com/api/v1/healthCheck`)
            .then(res => {
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })
}

```

---

# How to run this project
This project is made with nodejs and mongodb. so if you want to run this project in your local system then ensure to follow the below steps.

### Step 1
install nodejs and mongodb in your local system and ensure that they are working properly.

### Step 2
To clone this project in your local system you first create a folder and then open that folder in your terminal and then run the below command.

`
git clone "https://github.com/kuntal-hub/codeweb-backend.git"
`

before running this command make sure that you have git installed in your local system.

### Step 3
after cloning this project in your local system you need to install all the dependencies that are used in this project. to install all the dependencies run the below command in your terminal.

`
npm install
`

this command will install all the dependencies that are used in this project.

### Step 4
after installing all the dependencies you need to create a .env file in the root directory of this project and then copy all the content from .env.example file and paste it in .env file and then change the value of all the variables according to your need.

### Step 5
after doing all the above steps you are ready to run this project in your local system. to run this project in your local system run the below command in your terminal.

`
npm run dev
`

congratulations now you have successfully run this project in your local system.

---

# How to contribute in this project

if you want to contribute in this project then you can contribute in this project by following the below steps.

### Step 1
fork this project in your github account by clicking on the fork button.

### Step 2
clone this project in your local system by following the same steps that are mentioned above.

### Step 3
after cloning this project in your local system create a new branch by running the below command in your terminal.

`
git checkout -b "your branch name"
`

### Step 4
after creating a new branch make your changes in that branch and then push that branch in your github account by running the below command in your terminal.

`
git push origin "your branch name"
`

### Step 5
after pushing the branch in your github account create a pull request and then I will review your pull request and then merge your pull request in the main branch.

---


