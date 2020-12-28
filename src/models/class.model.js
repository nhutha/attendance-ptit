import connectDB from "../utils/connectDB";
import TypeRole from "../constants/TypeRole"

export const createClass = async (req, res, next) => {
  try {
    const connect = connectDB.connect;
    const { className = '' } = req.body;
    if (!className) {
      let error = new Error();
      error.message = "className is required";
      error.status = 400;
      throw error;
    }

    const queryCheckClassName = `select * from class where className = N'${className}'`

    const { recordset: recordsetCheck } = await connect.query(queryCheckClassName);
    if (recordsetCheck.length > 0) {
      let error = new Error();
      error.message = `className ${className} is already exits`;
      error.status = 400;
      throw error;
    }

    const query = `EXEC dbo.sp_createClass N'${className}'`;
    const { recordset: recordsetCreate, rowsAffected: rowsAffectedCreate } = await connect.query(query);
    if (rowsAffectedCreate.length > 0) {
      res.status(200).send({
        message: `Create class ${className} success`,
        result: recordsetCreate[0]
      })
    } else {
      let error = new Error();
      error.message = "Create class fail";
      error.status = 500;
      throw error;
    }

  } catch (e) {
    next(e)
  }
}

export const getListClass = async (req, res, next) => {
  try {
    const connect = connectDB.connect;

    const query = `SELECT idClass, className FROM class where isDelete = 0`;

    const { recordset } = await connect.query(query);

    if (recordset.length > 0) {
      res.status(200).send({
        message: `Get list class success`,
        result: recordset
      })
    } else {
      let error = new Error();
      error.message = "Class not found";
      error.status = 404;
      throw error;
    }

  } catch (e) {
    next(e);
  }
}

export const updateClassById = async (req, res, next) => {
  try {
    const connect = connectDB.connect;

    const { id } = req.params;

    let query = `SELECT * FROM class where idClass = '${id}' and isDelete = 0`;
    const { recordset } = await connect.query(query);

    if (recordset.length > 0) {

      const classFound = recordset[0];

      let { className } = req.body;
      if (className) {

        const queryCheckClassName = `select * from class where className = N'${className}'`

        const { recordset: recordsetCheck } = await connect.query(queryCheckClassName);
        if (recordsetCheck.length > 0) {
          let error = new Error();
          error.message = `className ${className} is already exits`;
          error.status = 400;
          throw error;
        }

        query = `UPDATE class SET className = N'${className}' where idClass = '${id}' and isDelete = 0`;

        const { rowsAffected } = await connect.query(query);

        if (rowsAffected > 0) {
          res.status(200).send({
            message: `Update class with id = ${id} success`
          })
        } else {
          let error = new Error();
          error.message = "Update class fail";
          error.status = 500;
          throw error;
        }
      } else {
        res.status(200).send({
          message: "No has new data to update"
        })
      }


    } else {
      let error = new Error();
      error.message = "Class not found";
      error.status = 404;
      throw error;
    }
  } catch (e) {
    next(e);
  }
}

export const deleteClassById = async (req, res, next) => {
  try {
    const connect = connectDB.connect;

    const { id } = req.params;

    let query = `SELECT * FROM class where idClass = '${id}' and isDelete = 0 `;
    const { recordset } = await connect.query(query);
    if (recordset.length > 0) {
      query = `Update class set isDelete = 1 where idClass = '${id}'`;

      const { rowsAffected } = await connect.query(query);

      if (rowsAffected > 0) {
        res.status(200).send({
          message: `Delete class with id = ${id} success`
        })
      } else {
        let error = new Error();
        error.message = "Delete class fail";
        error.status = 500;
        throw error;
      }

    } else {
      let error = new Error();
      error.message = "Class not found";
      error.status = 404;
      throw error;
    }
  } catch (e) {
    next(e);
  }
}

export const getClassById = async (req, res, next) => {
  try {
    const connect = connectDB.connect;

    const { id } = req.params;

    let query = `SELECT idClass,className FROM class where idClass = '${id}'`;
    const { recordset } = await connect.query(query);
    if (recordset.length > 0) {
      res.status(200).send({
        message: "Get class success",
        result: recordset[0]
      })
    } else {
      let error = new Error();
      error.message = "Class not found";
      error.status = 404;
      throw error;
    }
  } catch (e) {
    next(e);
  }
}

export const getClassByTeacher = async (req, res, next) => {
  try {

    const connect = connectDB.connect;

    const { id } = req.decode;

    const queryCheckTeacher = `SELECT u.gender,u.id,u.phoneNumber,u.avatar,u.fullName,u.dateOfBirth,u.email,r.name as role FROM [user] u join role r on u.idRole = r.id where u.id= ${id} and r.name='${TypeRole.TEACHER}'`

    const { recordset } = await connect.query(queryCheckTeacher);

    if (recordset.length > 0) {

      const query = `SELECT u.id AS idUser, u.gender, u.phoneNumber, u.avatar, u.fullName, u.dateOfBirth, u.email,c.name as class_name, c.id as classId, s.name as subject_name FROM dbo.class_subject cb JOIN dbo.subject s ON s.id = cb.idSubject JOIN dbo.class c ON c.id = cb.idClass JOIN dbo.[user] u ON u.id = s.idTeacher WHERE s.idTeacher = ${id}`

      const { recordset: data } = await connect.query(query);
      res.status(200).send({
        message: "Get list class success",
        result: data
      })
    } else {
      let error = new Error();
      error.message = "Class not found";
      error.status = 404;
      throw error;
    }
  } catch (e) {
    next(e);
  }
}

export const getListStudentByClass = async (req, res, next) => {
  try {

  } catch (e) {
    next(e);
  }
}