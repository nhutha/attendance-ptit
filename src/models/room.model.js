import connectDB from "../utils/connectDB";

export const createRoom = async (req, res, next) => {
    try {
        const connect = connectDB.connect;
        const { roomName } = req.body;
        if (!roomName) {
            let error = new Error();
            error.message = "roomName is required";
            error.status = 400;
            throw error;
        }

        let queryCheck = `SELECT * FROM room where roomName ='${roomName}'`;

        const { recordset: recordsetCheck } = await connect.query(queryCheck);

        if (recordsetCheck.length > 0) {
            throw new Error(`roomName ${roomName} already exist`)
        }

        const query = `INSERT INTO room(roomName) values( N'${roomName}' )`;
        const { rowsAffected } = await connect.query(query);
        if (rowsAffected > 0) {
            res.status(200).send({
                message: `Create room '${roomName}' success`
            })
        } else {
            let error = new Error();
            error.message = "Create room fail";
            error.status = 500;
            throw error;
        }

    } catch (e) {
        next(e)
    }
}

export const getListRoom = async (req, res, next) => {
    try {
        const connect = connectDB.connect;

        const query = `SELECT * from room where isDelete = 0`;

        const { recordset } = await connect.query(query);

        if (recordset.length > 0) {
            res.status(200).send({
                message: `Get list room success`,
                result: recordset
            })
        } else {
            let error = new Error();
            error.message = "Room not found";
            error.status = 404;
            throw error;
        }

    } catch (e) {
        next(e);
    }
}

export const updateRoomById = async (req, res, next) => {
    try {
        const connect = connectDB.connect;

        const { id } = req.params;


        let query = `SELECT * FROM room where idRoom ='${id}' and isDelete = 0`;

        const { recordset } = await connect.query(query);

        if (recordset.length > 0) {
            const roomFound = recordset[0];

            let { roomName } = req.body;
            if (roomName) {
                let queryCheck = `SELECT * FROM room where roomName ='${roomName}'`;

                const { recordset: recordsetCheck } = await connect.query(queryCheck);

                if (recordsetCheck.length > 0) {
                    throw new Error(`roomName ${roomName} already exist`)
                }

                query = `UPDATE room SET roomName = N'${roomName}' where idRoom ='${id}'`;
                const { rowsAffected } = await connect.query(query);

                if (rowsAffected > 0) {
                    res.status(200).send({
                        message: `Update room with id = ${id} success`
                    })
                } else {
                    let error = new Error();
                    error.message = "Update room fail";
                    error.status = 500;
                    throw error;
                }
            }

        } else {
            let error = new Error();
            error.message = "Room not found";
            error.status = 404;
            throw error;
        }


    } catch (e) {
        console.log("error ", e.message)
        next(e);
    }
}

export const deleteRoomById = async (req, res, next) => {
    try {
        const connect = connectDB.connect;

        const { id } = req.params;

        let query = `SELECT * FROM room where idRoom = '${id}'`;
        const { recordset } = await connect.query(query);
        if (recordset.length > 0) {
            query = `Update room set isDelete = 1 where idRoom = '${id}'`;

            const { rowsAffected } = await connect.query(query);

            if (rowsAffected > 0) {
                res.status(200).send({
                    message: `Delete room with id = ${id} success`
                })
            } else {
                let error = new Error();
                error.message = "Delete room fail";
                error.status = 500;
                throw error;
            }

        } else {
            let error = new Error();
            error.message = "Room not found";
            error.status = 404;
            throw error;
        }
    } catch (e) {
        next(e);
    }
}

export const getRoomById = async (req, res, next) => {
    try {
        const connect = connectDB.connect;

        const { id } = req.params;

        let query = `SELECT * FROM room where idRoom = '${id}' and isDelete = 0`;
        const { recordset } = await connect.query(query);
        if (recordset.length > 0) {
            res.status(200).send({
                message: "Get room success",
                result: recordset[0]
            })
        } else {
            let error = new Error();
            error.message = "Room not found";
            error.status = 404;
            throw error;
        }
    } catch (e) {
        next(e);
    }
}