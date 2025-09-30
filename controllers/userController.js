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

export async function createUser(req, res) {
  try {
    const newUserData = req.body;

    // ✅ Check if email already exists
    const existingUser = await User.findOne({ email: newUserData.email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered."
      });
    }

    // ✅ Prevent admin account creation from public route
    if (newUserData.type === "admin") {
      if (!req.user || req.user.type !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only logged-in administrators can create admin accounts."
        });
      }
    }

    // ✅ Hash password
    newUserData.password = bcrypt.hashSync(newUserData.password, 10);

    // ✅ Save user
    const user = new User(newUserData);
    await user.save();

    return res.status(201).json({
      success: true,
      message: "User created successfully."
    });

  } catch (error) {
    console.error("User creation failed:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "User not created."
    });
  }
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




