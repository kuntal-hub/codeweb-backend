
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

```
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

```
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

```
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

```
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

```
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

```
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

```
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

```
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

```
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

```
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

```
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

```
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

```
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

```
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

```
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

```
function getUserProfile({username,currentUser}) {
    // if user not loged in then currentUser is optional currentUser = _id of loged in user
    axios.get(`https://codeweb.onrender.com/api/v1/users/profile/${username}?currentUser=${currentUser}`)
        .then(res => {
            console.log(res.data)
        })
        .catch(err => {
            console.log(err.message)
        })
}
```

### get pined items

```
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

```
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

```
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

```
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

## web routes

### create new web

``

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


