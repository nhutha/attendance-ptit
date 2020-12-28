import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import ejs from "ejs";
import appRoot from "app-root-path"

import transporter from "../utils/sendEmail"
import TypeRole from "../constants/TypeRole";
import connectDB from "../utils/connectDB";
import { changeFileName, deleteFile } from "../utils/file";


export const createDefaultAdmin = async () => {
  try {
    const connect = connectDB.connect;
    const queryCheckDefaultAdmin = `SELECT * FROM [user] where email = 'nhuthahuu@gmail.com'`;

    const { recordset } = await connect.query(queryCheckDefaultAdmin);

    if (recordset.length <= 0) {
      const queryGetRoleAdmin = `SELECT * FROM role where roleName= '${TypeRole.ADMIN}'`
      const { recordset } = await connect.query(queryGetRoleAdmin);
      if (recordset.length > 0) {
        const password = await bcrypt.hash("admin", +process.env.saltRound);
        const query = `INSERT INTO [user](email, password, firstName, lastName, gender, dateOfBirth, image, idRole) values ('nhuthahuu@gmail.com','${password}','Nhut','Ha Huu','B',897584400,'image',${recordset[0].idRole} ) `;

        const { rowsAffected } = await connect.query(query)
        if (rowsAffected > 0) {
          console.log("Admin default")
          console.log({
            email: "nhuthahuu@gmail.com",
            password: "admin"
          })
        } else {
          console.log("Create user admin fail");
        }
      } else {
        console.log("Role admin not found when create default user admin");
      }
    } else {
      console.log("Admin default")
      console.log({
        username: "admin",
        password: "admin"
      })
    }
  } catch (e) {
    console.log("Create default user admin fail ", e)
  }
}

export const login = async (req, res, next) => {
  try {

    const connect = connectDB.connect;

    const { password, email } = req.body;

    if (!email || !password) {
      let error = new Error();
      error.message = "Email and password is required";
      error.status = 400;
      throw error;
    }

    const query = `SELECT u.*, r.roleName as role FROM [user] u JOIN role r on u.idRole = r.idRole where u.email = '${email}' and isDelete = 0`;

    const { recordset } = await connect.query(query);
    if (recordset.length <= 0) {
      let error = new Error();
      error.message = "Email or password incorrect";
      error.status = 400;
      throw error;
    } else {
      const { role, gender, firstName, lastName, dateOfBirth, password: hashPassword, code, email, idUser } = recordset[0];
      if (code) {

        const checkCurrentPassword = await bcrypt.compare(password, code);

        if (checkCurrentPassword) {

          let payload = {
            roleName: role,
            gender,
            firstName,
            lastName,
            dateOfBirth,
            email,
            idUser
          }

          const token = await jwt.sign(payload, process.env.JWT_KEY);
          res.status(200).send({
            message: "Login success",
            result: {
              token,
              isFirstLogin: true
            }
          })

        }

      }

      const result = await bcrypt.compare(password, hashPassword);

      if (result) {
        const payload = {
          roleName: role,
          gender,
          firstName,
          lastName,
          dateOfBirth,
          email,
          idUser
        }
        const token = await jwt.sign(payload, process.env.JWT_KEY);
        res.status(200).send({
          message: "Login success",
          result: {
            token,
            isFirstLogin: false
          }
        })
      } else {
        let error = new Error();
        error.message = "Email or password incorrect";
        error.status = 400;
        throw error;
      }
    }

  } catch (e) {
    next(e);
  }
}

export const forgotPassword = async (req, res, next) => {
  try {
    const connect = connectDB.connect;

    const { email } = req.body;
    if (!email) {
      let error = new Error();
      error.message = "Email is required";
      error.status = 400;
      throw error;
    }
    const queryCheckEmail = `SELECT * FROM [user] where email = '${email}' and isDelete = 0`;

    const { recordset } = await connect.query(queryCheckEmail);
    if (recordset.length > 0) {
      let codeActive = Math.floor(100000 + Math.random() * 900000);
      const userFound = recordset[0];

      const template = await ejs.renderFile(appRoot.path + "/src/templates/email-forgot-password.ejs",
        { name: userFound.lastName + ' ' + userFound.firstName, code: codeActive });

      transporter.sendMail({
        from: "Attendance",
        to: email,
        subject: "Code change password",
        html: template
      });

      const codeHash = await bcrypt.hash(codeActive + "", +process.env.saltRound);

      const queryInsertCode = `Update [user] set code = '${codeHash}' where email = '${userFound.email}'`;

      const { rowsAffected } = await connect.query(queryInsertCode);

      if (rowsAffected > 0) {

        setInterval(() => {
          const queryRemoveCodeChangePassword = `Update [user] set code = '' where email = ${email}`;

          connect.query(queryRemoveCodeChangePassword).then(res => [
            console.log("success", res)
          ]).catch(err => {
            console.log('err', err)
          });


        }, 300000)

        res.status(200).send({
          message: "Please check your email to see code change password, code will be expired in 5 minutes"
        })
      } else {
        let error = new Error();
        error.message = "Insert code change password fail";
        error.status = 500;
        throw error;
      }
    } else {
      let error = new Error();
      error.message = "Email not found";
      error.status = 400;
      throw error;
    }

  } catch (e) {
    next(e);
  }
}

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, password, confirmPassword } = req.body;

    const { email } = req.decode;

    const connect = connectDB.connect;

    if (!currentPassword || !password || !confirmPassword) {
      let error = new Error();
      error.message = "currentPassword, password and confirmPassword is required";
      error.status = 400;
      throw error;
    }

    if (password !== confirmPassword) {
      let error = new Error();
      error.message = "Password and confirmPassword do not match";
      error.status = 400;
      throw error;
    }

    const queryCheckPassword = `SELECT * FROM [user] where email='${email}' and isDelete = 0`;

    const { recordset } = await connect.query(queryCheckPassword)

    if (recordset.length > 0) {
      const userFound = recordset[0];
      const { password: passwordHash, code } = userFound;
      let result = false;
      if (code) {
        result = await bcrypt.compare(currentPassword, code);
      } else {
        result = await bcrypt.compare(currentPassword, passwordHash);
      }

      if (result) {

        const newPassword = await bcrypt.hash(password, +process.env.saltRound);

        const queryChangePassword = `Update [user] set password = '${newPassword}', code = '' where email = '${userFound.email}' `;

        const { rowsAffected } = await connect.query(queryChangePassword);
        if (rowsAffected > 0) {
          res.status(200).send({
            message: "Change password success"
          })
        } else {
          let error = new Error();
          error.message = "Change password fail";
          error.status = 500;
          throw error;
        }
      } else {
        let error = new Error();
        error.message = "Password wrong";
        error.status = 401;
        throw error;
      }
    } else {
      let error = new Error();
      error.message = "Please login";
      error.status = 401;
      throw error;
    }
  } catch (e) {
    next(e);
  }
}

export const getProfile = async (req, res, next) => {
  try {

    const connect = connectDB.connect;

    const { email, roleName } = req.decode;

    let queryCheckUser = `select email,firstName,lastName,gender,dateOfBirth,image,idUser from [user] where email = '${email}' and isDelete = 0`

    if (roleName === TypeRole.TEACHER) {
      queryCheckUser = `select t.idTeacher,t.bluetoothAddress,u.email,u.firstName,u.lastName,u.gender,u.dateOfBirth,u.image,u.idUser from [user] u join teacher t on u.idUser = t.idUser where u.email = '${email}' and t.isDelete = 0`
    }
    if (roleName === TypeRole.STUDENT) {
      queryCheckUser = `SELECT s.idStudent,s.idClass,c.className ,u.email,u.firstName,u.lastName,u.gender,u.dateOfBirth,u.image,u.idUser from [user] u join student s on u.idUser = s.idUser JOIN class c on c.idClass = s.idClass where u.email = '${email}' and s.isDelete = 0`
    }

    const { recordset } = await connect.query(queryCheckUser)

    if (recordset.length > 0) {
      recordset[0].dateOfBirth = + recordset[0].dateOfBirth
      res.status(200).send({
        message: "Get profile user success",
        result: recordset[0]
      })
    } else {
      let error = new Error();
      error.message = "User not found";
      error.status = 404;
      throw error;
    }

  } catch (e) {
    next(e);
  }
}

export const updateProfile = async (req, res, next) => {
  let avatar = "";
  try {
    const { file } = req;

    const connect = connectDB.connect;

    console.log("file", file)

    if (!file) {
      let error = new Error();
      error.message = "Avatar is required";
      error.status = 404;
      throw error;
    }

    const { idUser, email, roleName } = req.decode;


    if (file) {
      avatar = changeFileName(file, email);
    }
    const queryCheckIdUser = `SELECT * FROM [user] where idUser = ${idUser}`;

    const { recordset: recordsetCheckId } = await connect.query(queryCheckIdUser);

    if (recordsetCheckId.length <= 0) {
      let error = new Error();
      error.message = "User not found";
      error.status = 404;
      throw error;
    }


    const queryUpdate = `Update [user] set image = '${avatar}' where idUser = ${idUser}`;

    const { rowsAffected } = await connect.query(queryUpdate);


    if (rowsAffected > 0) {
      res.status(200).send({
        message: "Update avatar success"
      })
    } else {
      let error = new Error();
      error.message = "Update avatar fail";
      error.status = 500;
      throw error;
    }

  } catch (e) {
    if (avatar) {
      deleteFile(appRoot.path + avatar)
    }
    next(e);
  }
}