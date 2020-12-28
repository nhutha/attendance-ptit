require("dotenv").config();

import jwt from "jsonwebtoken";

import TypeRole from "../constants/TypeRole"
import connectDB from "../utils/connectDB";

export const checkToken = async (req, res, next) => {
  try {
    const connect = connectDB.connect;

    const { authorization } = req.headers;
    if (!authorization) {
      return res.status(400).send({
        message: "Please login"
      })
    }
    const decode = await jwt.verify(authorization, process.env.JWT_KEY);

    const queryCheckUser = `SELECT * FROM [user] where email = '${decode.email}'`;

    const { recordset } = await connect.query(queryCheckUser);
    if (recordset.length > 0) {
      req.decode = decode;
      next();
    } else {
      return res.status(401).send({
        message: "Please login"
      });
    }
  } catch (e) {
    next(e);
  }
}

export const checkAdmin = async (req, res, next) => {
  try {
    const connect = connectDB.connect;

    const { authorization } = req.headers;
    if (!authorization) {
      return res.status(400).send({
        message: "Please login"
      })
    }
    const decode = await jwt.verify(authorization, process.env.JWT_KEY);

    const queryCheckUser = `SELECT * FROM [user] u join role r on u.idRole = r.idRole where email = '${decode.email}'`;

    const { recordset } = await connect.query(queryCheckUser);
    if (recordset.length > 0 && recordset[0].roleName === TypeRole.ADMIN) {
      req.decode = decode;
      next();
    } else {
      return res.status(401).send({
        message: "Please login"
      });
    }
  } catch (e) {
    next(e);
  }
}

export const checkTeacher = async (req, res, next) => {
  try {
    const connect = connectDB.connect;

    const { authorization } = req.headers;
    if (!authorization) {
      return res.status(400).send({
        message: "Please login"
      })
    }
    const decode = await jwt.verify(authorization, process.env.JWT_KEY);

    const queryCheckUser = `SELECT * FROM [user] u join role r on u.idRole = r.idRole where email = '${decode.email}'`;

    const { recordset } = await connect.query(queryCheckUser);


    if (recordset.length > 0 && recordset[0].roleName === TypeRole.TEACHER) {
      req.decode = decode;
      next();
    } else {
      return res.status(401).send({
        message: "Please login"
      });
    }
  } catch (e) {
    next(e);
  }
}

export const checkStudent = async (req, res, next) => {
  try {
    const connect = connectDB.connect;

    const { authorization } = req.headers;
    console.log('aur ', authorization)
    if (!authorization) {
      return res.status(400).send({
        message: "Please login"
      })
    }
    const decode = await jwt.verify(authorization, process.env.JWT_KEY);

    const queryCheckUser = `SELECT * FROM [user] u join role r on u.idRole = r.idRole where email = '${decode.email}'`;

    const { recordset } = await connect.query(queryCheckUser);
    if (recordset.length > 0 && recordset[0].roleName === TypeRole.STUDENT) {
      req.decode = decode;
      next();
    } else {
      return res.status(401).send({
        message: "Please login"
      });
    }
  } catch (e) {
    next(e);
  }
}


