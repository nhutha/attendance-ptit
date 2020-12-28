import connectDB from "../utils/connectDB";

export const createSchedule = async (req, res, next) => {
    try {
        const connect = connectDB.connect;
        const { day, startTime, period } = req.body;
        if (!day || !startTime || !period) {
            let error = new Error();
            error.message = "day, period and startTime is required";
            error.status = 400;
            throw error;
        }

        if (typeof +day !== 'number') {
            let error = new Error();
            error.message = "day must a number from 1 to 7";
            error.status = 400;
            throw error;
        }

        if (typeof +startTime !== 'number') {
            let error = new Error();
            error.message = "startTime must a number";
            error.status = 400;
            throw error;
        }

        if (+startTime < 1 || +startTime > 24) {
            let error = new Error();
            error.message = "startTime start from 1 to 24";
            error.status = 400;
            throw error;
        }

        if (+day < 1 || +day > 7) {
            let error = new Error();
            error.message = "day start from 1 to 7";
            error.status = 400;
            throw error;
        }

        if (typeof +period !== 'number') {
            let error = new Error();
            error.message = "period must a number";
            error.status = 400;
            throw error;
        }

        const query = `INSERT INTO schedule(day, startTime, period) values(${day}, ${startTime}, ${period})`;

        const { rowsAffected } = await connect.query(query);
        if (rowsAffected > 0) {
            res.status(200).send({
                message: `Create schedule success`
            })
        } else {
            let error = new Error();
            error.message = "Create schedule fail";
            error.status = 500;
            throw error;
        }

    } catch (e) {
        next(e)
    }
}

export const getListSchedule = async (req, res, next) => {
    try {
        const connect = connectDB.connect;

        const query = `SELECT idSchedule, day, startTime, period FROM schedule where isDelete = 0`;

        const { recordset } = await connect.query(query);

        if (recordset.length > 0) {
            for (let i = 0; i < recordset.length; i++) {

                switch (recordset[i].day) {
                    case 1: recordset[i].day = 'Sunday'; break;
                    case 2: recordset[i].day = 'Monday'; break;
                    case 3: recordset[i].day = 'Tuesday'; break;
                    case 4: recordset[i].day = 'Wednesday'; break;
                    case 5: recordset[i].day = 'Thursday'; break;
                    case 6: recordset[i].day = 'Friday'; break;
                    case 7: recordset[i].day = 'Saturday'; break;
                }
                if (recordset[i].startTime >= 12) {
                    recordset[i].session = "afternoon"
                } else {
                    recordset[i].session = "morning"
                }
            }
            res.status(200).send({
                message: `Get list schedule success`,
                result: recordset
            })
        } else {
            let error = new Error();
            error.message = "Schedule not found";
            error.status = 404;
            throw error;
        }

    } catch (e) {
        next(e);
    }
}

export const updateScheduleById = async (req, res, next) => {
    try {
        const connect = connectDB.connect;

        const { idSchedule } = req.params;

        const queryCheck = `SELECT * FROM schedule where idSchedule = ${idSchedule} and isDelete = 0`;

        const { recordset } = await connect.query(queryCheck);
        if (recordset.length > 0) {
            const scheduleFound = recordset[0];

            let { day, startTime, period } = req.body;

            if (!day) {
                day = scheduleFound.day
            } else {
                if (typeof +day !== 'number') {
                    let error = new Error();
                    error.message = "day must a number from 1 to 7";
                    error.status = 400;
                    throw error;
                }
                if (+day < 1 || +day > 7) {
                    let error = new Error();
                    error.message = "day start from 1 to 7";
                    error.status = 400;
                    throw error;
                }
            }


            if (!startTime) {
                startTime = scheduleFound.startTime
            } else {
                if (typeof +startTime !== 'number') {
                    let error = new Error();
                    error.message = "startTime must a number";
                    error.status = 400;
                    throw error;
                }

                if (+startTime < 1 || +startTime > 24) {
                    let error = new Error();
                    error.message = "startTime start from 1 to 24";
                    error.status = 400;
                    throw error;
                }
            }

            if (!period) {
                period = scheduleFound.period
            } else {
                if (typeof +period !== 'number') {
                    let error = new Error();
                    error.message = "period must a number";
                    error.status = 400;
                    throw error;
                }
            }

            const query = `UPDATE schedule SET day = ${day}, startTime = ${startTime}, period = ${period} where idSchedule = ${idSchedule}`;

            const { rowsAffected } = await connect.query(query);

            if (rowsAffected > 0) {
                res.status(200).send({
                    message: `Update schedule success`
                })
            } else {
                let error = new Error();
                error.message = "Update schedule fail";
                error.status = 500;
                throw error;
            }

        } else {
            let error = new Error();
            error.message = "schedule not found";
            error.status = 404;
            throw error;
        }


    } catch (e) {
        next(e);
    }
}

export const deleteScheduleById = async (req, res, next) => {
    try {
        const connect = connectDB.connect;

        const { idSchedule } = req.params;

        const queryCheck = `SELECT * FROM schedule where idSchedule = ${idSchedule}`;
        const { recordset } = await connect.query(queryCheck);
        if (recordset.length > 0) {
            const query = `Update schedule set isDelete = 1 where idSchedule = ${idSchedule}`;

            const { rowsAffected } = await connect.query(query);

            if (rowsAffected > 0) {
                res.status(200).send({
                    message: `Delete schedule success`
                })
            } else {
                let error = new Error();
                error.message = "Delete schedule fail";
                error.status = 500;
                throw error;
            }

        } else {
            let error = new Error();
            error.message = "schedule not found";
            error.status = 404;
            throw error;
        }
    } catch (e) {
        next(e);
    }
}

export const getScheduleById = async (req, res, next) => {
    try {
        const connect = connectDB.connect;

        const { idSchedule } = req.params;

        let query = `SELECT * FROM schedule where idSchedule = ${idSchedule} and isDelete = 0`;
        const { recordset } = await connect.query(query);
        if (recordset.length > 0) {
            switch (recordset[0].day) {
                case 1: recordset[0].day = 'Sunday'; break;
                case 2: recordset[0].day = 'Monday'; break;
                case 3: recordset[0].day = 'Tuesday'; break;
                case 4: recordset[0].day = 'Wednesday'; break;
                case 5: recordset[0].day = 'Thursday'; break;
                case 6: recordset[0].day = 'Friday'; break;
                case 7: recordset[0].day = 'Saturday'; break;
            }
            if (recordset[0].startTime > 12) {
                recordset[0].session = 'afternoon'
            } else {
                recordset[0].session = 'morning'
            }
            res.status(200).send({
                message: "Get schedule success",
                result: recordset[0]
            })
        } else {
            let error = new Error();
            error.message = "schedule not found";
            error.status = 404;
            throw error;
        }
    } catch (e) {
        next(e);
    }
}

export const createDefaultSchedule = async (req, res, next) => {
    try {
        const queryCheck = `SELECT * FROM schedule`;

        const connect = connectDB.connect;

        const { recordset } = await connect.query(queryCheck);

        if (recordset.length <= 0) {
            for (let i = 1; i < 8; i++) {

                const queryMorning = `INSERT INTO schedule(day, startTime, period) values( ${i}, ${7},${4})`;

                const queryAfternoon = `INSERT INTO schedule(day, startTime, period) values( ${i}, ${13},${4})`;

                const { rowsAffected } = await connect.query(queryMorning);
                if (rowsAffected <= 0) {
                    console.log("create default schedule fail")
                }

                const { rowsAffected: rowsAffectedAfternoon } = await connect.query(queryAfternoon);
                if (rowsAffectedAfternoon <= 0) {
                    console.log("create default schedule fail")
                }
            }
        }
    } catch (e) {
        console.log("error when create default schedule", e);
    }
}
