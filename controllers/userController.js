import User from "../models/user.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import dotenv from "dotenv";
dotenv.config()

export function getUser(req, res){

    User.find().then(
        (userList)=>{
            res.json({
                List: userList
            })
        }
    ).catch(()=>{
        res.json({
            message: "Unsuccessfull."
        })
    })
}

// Get user by email
export function getUserByEmail(req, res){
    const { email } = req.params;
    
    User.findOne({ email: email }).then(
        (user)=>{
            if(user){
                res.json({
                    success: true,
                    user: {
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        phone: user.phone,
                        address: user.address,
                        type: user.type
                    }
                })
            } else {
                res.status(404).json({
                    success: false,
                    message: "User not found"
                })
            }
        }
    ).catch((error)=>{
        res.status(500).json({
            success: false,
            message: "Error fetching user data",
            error: error.message
        })
    })
}

export function createUser(req, res){

    const newUserData = req.body

    if(newUserData.type == "admin"){

        if(req.user == null){
            res.json({
                message: "Please login as administrator to create admin accounts"
            })
            return

        }

         if(req.user.type != "admin"){
            res.json({
                message: "Please login as administrator to create admin accounts"
            })
            return

        }

        

    }

    newUserData.password = bcrypt.hashSync(newUserData.password, 10)
    
    const user = new User(newUserData)

    user.save().then(()=>{
        res.json({
            message: "User created."
        })
    }).catch(()=>{
        res.json({
            message: "User not created."
        })
    })
 }

// export function createUser(req, res) {
//     const newUserData = req.body;

//     // Hash the password
//     newUserData.password = bcrypt.hashSync(newUserData.password, 10);

//     // Create and save the new user
//     const user = new User(newUserData);

//     user.save()
//         .then(() => {
//             res.json({
//                 message: "User created successfully."
//             });
//         })
//         .catch(() => {
//             res.json({
//                 message: "User creation failed."
//             });
//         });
// }

 export function deleteUser(req, res){
    User.deleteOne({name: req.params.email}).then(()=>{
        res.json({
            message: "User delete successfull."
        })
        
    }).catch(()=>{
        res.json({
            message: "User delete unsuccessfully."
        })
    })
}

export function loginUser(req, res){

    User.find({email: req.body.email}).then(
        (users)=>{
           if(users.length==0){
            res.json({
                message: "User not found."
            })
           }else{
              const user = users[0]

              const isPasswordCorrect = bcrypt.compareSync(req.body.password, user.password)

              if(isPasswordCorrect){
                const token = jwt.sign({ //generate the token
                    email : user.email,
                    firstName : user.firstName,
                    lastName : user.lastName,
                    isBlocked : user.isBlocked,
                    type : user.type,
                    profilePicture : user.profilePicture
                }, process.env.SECRET)
                
                res.json({
                    message : "User logged in.",
                    token: token,
                    user: {
                    firstName: user.firstName,
                    lastName: user.lastName,
                    type: user.type,
                    profilePicture: user.profilePicture,
                    email: user.email
                    }
                    
                })

              }else{
                res.json({
                    messsage: "Password incorrect."
                })
              }
           }
        })
}

export function isAdmin(req){
     if(req.user == null){
            return false 
        }

         if(req.user.type != "admin"){
            return false
        }

        return true
}

export function isCustomer(req){
     if(req.user == null){
            return false 
        }

         if(req.user.type != "customer"){
            return false
        }

        return true
}


