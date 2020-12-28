import connectDB from "../utils/connectDB";

export const createSubject = async (req, res, next) => {
  try {
    const connect = connectDB.connect;
    const { subjectName, numberOfCredits } = req.body;


    if (!subjectName || !numberOfCredits) {
      let error = new Error();
      error.message = "subjectName and numberOfCredits is required";
      error.status = 400;
      throw error;
    }

    const query = `EXEC dbo.sp_createSubject N'${subjectName}', ${numberOfCredits}`;
    const { recordset: recordsetCreate, rowsAffected: rowsAffectedCreate } = await connect.query(query);
    if (rowsAffectedCreate.length > 0) {
      res.status(200).send({
        message: `Create subject success`,
        result: recordsetCreate[0]
      })
    } else {
      let error = new Error();
      error.message = "Create subject fail";
      error.status = 500;
      throw error;
    }

  } catch (e) {
    next(e)
  }
}

export const getListSubject = async (req, res, next) => {
  try {
    const connect = connectDB.connect;

    const query = `SELECT idSubject,subjectName, numberOfCredits from subject`;

    const { recordset } = await connect.query(query);

    if (recordset.length > 0) {
      res.status(200).send({
        message: `Get list subject success`,
        result: recordset
      })
    } else {
      let error = new Error();
      error.message = "Subject not found";
      error.status = 404;
      throw error;
    }

  } catch (e) {
    next(e);
  }
}

export const updateSubjectById = async (req, res, next) => {
  try {
    const connect = connectDB.connect;

    const { id } = req.params;


    let query = `SELECT * FROM subject where idSubject ='${id}'`;

    const { recordset } = await connect.query(query);
    if (recordset.length > 0) {
      const subjectFound = recordset[0];

      let { subjectName, numberOfCredits } = req.body;
      if (!subjectName) {
        subjectName = subjectFound.subjectName;
      }
      if (!numberOfCredits) {
        numberOfCredits = subjectFound.numberOfCredits
      }
      query = `UPDATE subject SET subjectName = N'${subjectName}', numberOfCredits= ${numberOfCredits} where idSubject ='${id}'`;
      const { rowsAffected } = await connect.query(query);

      if (rowsAffected > 0) {
        res.status(200).send({
          message: `Update subject with id = ${id} success`
        })
      } else {
        let error = new Error();
        error.message = "Update subject fail";
        error.status = 500;
        throw error;
      }

    } else {
      let error = new Error();
      error.message = "Subject not found";
      error.status = 404;
      throw error;
    }


  } catch (e) {
    next(e);
  }
}

export const deleteSubjectById = async (req, res, next) => {
  try {
    const connect = connectDB.connect;

    const { id } = req.params;

    let query = `SELECT * FROM subject where idSubject = '${id}'`;
    const { recordset } = await connect.query(query);
    if (recordset.length > 0) {
      query = `DELETE subject where idSubject = '${id}'`;

      const { rowsAffected } = await connect.query(query);

      if (rowsAffected > 0) {
        res.status(200).send({
          message: `Delete subject with id = ${id} success`
        })
      } else {
        let error = new Error();
        error.message = "Delete subject fail";
        error.status = 500;
        throw error;
      }

    } else {
      let error = new Error();
      error.message = "Subject not found";
      error.status = 404;
      throw error;
    }
  } catch (e) {
    next(e);
  }
}

export const getSubjectById = async (req, res, next) => {
  try {
    const connect = connectDB.connect;

    const { id } = req.params;

    let query = `SELECT idSubject,subjectName, numberOfCredits FROM subject where idSubject = '${id}'`;
    const { recordset } = await connect.query(query);
    if (recordset.length > 0) {
      res.status(200).send({
        message: "Get subject success",
        result: recordset[0]
      })
    } else {
      let error = new Error();
      error.message = "Subject not found";
      error.status = 404;
      throw error;
    }
  } catch (e) {
    next(e);
  }
}