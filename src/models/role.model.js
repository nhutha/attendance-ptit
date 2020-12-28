import connectDB from "../utils/connectDB";
import TypeRole from "../constants/TypeRole";

export const createRole = async (req, res, next) => {
  try {
    const connect = connectDB.connect;
    const { name = '' } = req.body;
    if (!name) {
      let error = new Error();
      error.message = "Name is required";
      error.status = 400;
      throw error;
    }
    const query = `INSERT INTO role values('${name}')`;

    const { rowsAffected } = await connect.query(query);
    if (rowsAffected > 0) {
      res.status(200).send({
        message: `Create role '${name}' success`
      })
    } else {
      let error = new Error();
      error.message = "Create role fail";
      error.status = 500;
      throw error;
    }

  } catch (e) {
    next(e)
  }
}

export const getListRole = async (req, res, next) => {
  try {
    const connect = connectDB.connect;

    const query = `SELECT * FROM role`;

    const { recordset } = await connect.query(query);

    if (recordset.length > 0) {
      res.status(200).send({
        message: `Get list role success`,
        result: recordset
      })
    } else {
      let error = new Error();
      error.message = "Role not found";
      error.status = 404;
      throw error;
    }

  } catch (e) {
    next(e);
  }
}

export const updateRoleById = async (req, res, next) => {
  try {
    const connect = connectDB.connect;

    const { id } = req.params;

    let query = `SELECT * FROM role where idRole = ${id}`;
    const { recordset } = await connect.query(query);
    if (recordset.length > 0) {
      const roleFound = recordset[0];

      let { name } = req.body;

      if (name.length <= 0) {
        name = roleFound.roleName
      }

      query = `UPDATE role SET roleName = '${name}' where idRole = ${id}`;

      const { rowsAffected } = await connect.query(query);

      if (rowsAffected > 0) {
        res.status(200).send({
          message: `Update role with id = ${id} success`
        })
      } else {
        let error = new Error();
        error.message = "Update role fail";
        error.status = 500;
        throw error;
      }

    } else {
      let error = new Error();
      error.message = "Role not found";
      error.status = 404;
      throw error;
    }


  } catch (e) {
    next(e);
  }
}

export const deleteRoleById = async (req, res, next) => {
  try {
    const connect = connectDB.connect;

    const { id } = req.params;

    let query = `SELECT * FROM role where idRole = ${id}`;
    const { recordset } = await connect.query(query);
    if (recordset.length > 0) {
      query = `DELETE role where idRole = ${id}`;

      const { rowsAffected } = await connect.query(query);

      if (rowsAffected > 0) {
        res.status(200).send({
          message: `Delete role with id = ${id} success`
        })
      } else {
        let error = new Error();
        error.message = "Delete role fail";
        error.status = 500;
        throw error;
      }

    } else {
      let error = new Error();
      error.message = "Role not found";
      error.status = 404;
      throw error;
    }
  } catch (e) {
    next(e);
  }
}

export const getRoleById = async (req, res, next) => {
  try {
    const connect = connectDB.connect;

    const { id } = req.params;

    let query = `SELECT * FROM role where idRole = ${id}`;
    const { recordset } = await connect.query(query);
    if (recordset.length > 0) {
      res.status(200).send({
        message: "Get role success",
        result: recordset[0]
      })
    } else {
      let error = new Error();
      error.message = "Role not found";
      error.status = 404;
      throw error;
    }
  } catch (e) {
    next(e);
  }
}

export const createDefaultRole = async () => {
  try {
    const connect = connectDB.connect;
    const queryCheckEmptyRole = "SELECT * FROM role";

    const { recordset } = await connect.query(queryCheckEmptyRole);

    if (recordset.length <= 0) {
      const queryCreateAdmin = `INSERT INTO role values('${TypeRole.ADMIN}')`;

      const queryCreateTeacher = `INSERT INTO role values('${TypeRole.TEACHER}')`;

      const queryCreateStudent = `INSERT INTO role values('${TypeRole.STUDENT}')`;

      const { rowsAffected: rowsAffectedAdmin } = await connect.query(queryCreateAdmin);

      if (rowsAffectedAdmin <= 0) {
        console.log("Create role admin fail");
      }

      const { rowsAffected: rowsAffectedStudent } = await connect.query(queryCreateStudent);

      if (rowsAffectedStudent <= 0) {
        console.log("Create role student fail");
      }

      const { rowsAffected: rowsAffectedTeacher } = await connect.query(queryCreateTeacher);

      if (rowsAffectedTeacher <= 0) {
        console.log("Create role teacher fail");
      }

    } else {
      console.log("Have role in database")
    }
  } catch (e) {
    console.log("Error when create default role ", e)
  }
}