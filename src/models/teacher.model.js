import bcrypt from "bcrypt";
import appRoot from "app-root-path";
import { findKey, xor } from "lodash"

import TypeRole from "../constants/TypeRole";
import connectDB from "../utils/connectDB";
import { changeFileName, deleteFile } from "../utils/file";
import { DateUtil } from "../utils/date-utils";

export const createTeacher = async (req, res, next) => {
    let avatar = '';
    try {
        const connect = connectDB.connect;

        const { email, firstName, lastName, gender, dateOfBirth, bluetoothAddress } = req.body;

        if (!email || !firstName || !gender || !lastName || !dateOfBirth) {
            let error = new Error();
            error.message = "email, gender, firstName, lastName and dateOfBirth is required";
            error.status = 400;
            throw error;
        }

        if (firstName.length > 10) {
            let error = new Error();
            error.message = `firstName have maximum 10 character`;
            error.status = 400;
            throw error;
        }

        const { file } = req;

        if (file) {
            avatar = changeFileName(file, email);
        }

        const queryGetRoleAdmin = `SELECT * FROM role where roleName = '${TypeRole.TEACHER}'`


        const { recordset } = await connect.query(queryGetRoleAdmin);
        if (recordset.length > 0) {

            const roleFound = recordset[0];

            const queryCheckEmail = `SELECT * from [user] where email = '${email}' and isDelete = 0`;

            const { recordset: recordsetCheckEmail } = await connect.query(queryCheckEmail);
            if (recordsetCheckEmail.length > 0) {
                let error = new Error();
                error.message = `email ${email} already exist`;
                error.status = 400;
                throw error;
            }

            const codeChangePasswordHash = await bcrypt.hash(process.env.CODE_CHANGE_PASSWORD, +process.env.saltRound);

            const query = `EXEC dbo.sp_createTeacher @email = '${email}', @firstName = N'${firstName}', @lastName = N'${lastName}', @gender='${gender}', @dateOfBirth =${dateOfBirth}, @bluetoothAddress ='${bluetoothAddress ? bluetoothAddress : ''}', @image ='${avatar}', @code = '${codeChangePasswordHash}' `;


            const { recordset: recordsetCreate, rowsAffected: rowsAffectedCreate } = await connect.query(query);
            if (rowsAffectedCreate.length > 0) {
                res.status(200).send({
                    message: "Create teacher success",
                    result: recordsetCreate[0]
                })

            } else {
                let error = new Error();
                error.message = "Create teacher fail";
                error.status = 500;
                throw error;
            }
        } else {
            let error = new Error();
            error.message = "Role teacher not found";
            error.status = 400;
            throw error;
        }
    } catch (e) {
        if (avatar) {
            deleteFile(appRoot.path + avatar)
        }
        next(e);
    }
}

export const updateTeacher = async (req, res, next) => {
    let avatar = '';
    try {

        const { idTeacher } = req.params;
        const connect = connectDB.connect;

        const queryCheckIdTeacher = `SELECT u.*, t.bluetoothAddress FROM teacher t JOIN [user] u ON t.idUser = u.idUser where t.idTeacher = '${idTeacher}' and t.isDelete = 0`;

        const { recordset: recordsetCheckIdTeacher } = await connect.query(queryCheckIdTeacher);

        if (recordsetCheckIdTeacher.length > 0) {

            const teacherFound = recordsetCheckIdTeacher[0];

            let { email, firstName, lastName, gender, dateOfBirth, bluetoothAddress, idRole } = req.body;

            if (!email) {
                email = teacherFound.email;
            }

            if (!firstName) {
                firstName = teacherFound.firstName
            } else {
                if (firstName.length > 10) {
                    let error = new Error();
                    error.message = `firstName have maximum 10 character`;
                    error.status = 400;
                    throw error;
                }
            }

            if (!lastName) {
                lastName = teacherFound.lastName
            }

            if (!gender) {
                gender = teacherFound.gender
            }

            if (!dateOfBirth) {
                dateOfBirth = teacherFound.dateOfBirth
            }

            if (!bluetoothAddress) {
                bluetoothAddress = teacherFound.bluetoothAddress
            }

            if (!idRole) {
                idRole = teacherFound.idRole
            } else {

                const queryCheckIdRole = `SELECT * FROM role where idRole = '${idRole}'`;

                const { recordset: recordsetCheckIdRole } = await connect.query(queryCheckIdRole);

                if (recordsetCheckIdRole.length <= 0) {
                    let error = new Error();
                    error.message = `idRole not found`;
                    error.status = 400;
                    throw error;
                }

            }

            const { file } = req;

            if (file) {
                avatar = changeFileName(file, email);
            }



            const queryUpdate = `EXEC dbo.sp_updateTeacher @email = '${email}', @firstName = N'${firstName}', @lastName = N'${lastName}', @gender='${gender}', @dateOfBirth =${dateOfBirth}, @bluetoothAddress ='${bluetoothAddress ? bluetoothAddress : ''}', @image ='${avatar}', @idRole = ${idRole}, @idTeacher = '${idTeacher}'`;
            const { recordset: recordsetUpdate, rowsAffected: rowsAffectedUpdate } = await connect.query(queryUpdate);
            if (rowsAffectedUpdate.length > 0) {

                res.status(200).send({
                    message: `Update teacher ${lastName} ${firstName} success`,
                    result: recordsetUpdate[0]
                })

            } else {
                let error = new Error();
                error.message = `Update teacher fail`;
                error.status = 400;
                throw error;
            }

        } else {
            let error = new Error();
            error.message = `idTeacher not found`;
            error.status = 404;
            throw error;
        }

    } catch (e) {
        if (avatar) {
            deleteFile(appRoot.path + avatar)
        }
        next(e)
    }
}

export const deleteTeacher = async (req, res, next) => {
    try {
        const { idTeacher } = req.params;
        const connect = connectDB.connect;
        const queryCheckIdTeacher = `SELECT * FROM teacher t join [user] u on t.idUser = u.idUser where t.idTeacher = '${idTeacher}' and t.isDelete = 0`;

        const { recordset: recordsetCheckIdTeacher } = await connect.query(queryCheckIdTeacher);
        if (recordsetCheckIdTeacher.length > 0) {

            const teacherFound = recordsetCheckIdTeacher[0];


            const queryDeleteTeacher = `EXEC dbo.sp_deleteTeacher @idTeacher = ${idTeacher}`
            const { rowsAffected: rowsAffectedDeleteTeacher } = await connect.query(queryDeleteTeacher);

            if (rowsAffectedDeleteTeacher.length > 0) {

                res.status(200).send({
                    message: `Delete teacher ${teacherFound.lastName} ${teacherFound.firstName} success`
                })

            } else {
                let error = new Error();
                error.message = `delete teacher ${teacherFound.lastName} ${teacherFound.firstName} fail`;
                error.status = 500;
                throw error;
            }
        } else {
            let error = new Error();
            error.message = `idTeacher not found`;
            error.status = 404;
            throw error;
        }

    } catch (e) {
        next(e)
    }
}

export const getTeacherById = async (req, res, next) => {
    try {
        const { idTeacher } = req.params;
        const connect = connectDB.connect;
        const query = `select t.idTeacher,t.bluetoothAddress,u.email,u.firstName,u.lastName,u.gender,u.dateOfBirth,u.image,u.idUser from [user] u join teacher t on u.idUser = t.idUser where t.idTeacher = '${idTeacher}' and t.isDelete = 0`
        const { recordset } = await connect.query(query);

        if (recordset.length > 0) {
            res.status(200).send({
                message: `Get teacher ${idTeacher} success`,
                result: recordset[0]
            })
        } else {
            let error = new Error();
            error.message = `idTeacher not found`;
            error.status = 404;
            throw error;
        }

    } catch (e) {
        next(e);
    }
}

export const getListTeacher = async (req, res, next) => {
    try {
        const connect = connectDB.connect;

        const query = `SELECT t.idTeacher,t.bluetoothAddress,u.email,u.firstName,u.lastName,u.gender,u.dateOfBirth,u.image,u.idUser from [user] u join teacher t on u.idUser = t.idUser where t.isDelete = 0`
        const { recordset } = await connect.query(query);

        if (recordset.length > 0) {

            res.status(200).send({
                message: `Get list teacher success`,
                result: recordset
            })
        } else {
            let error = new Error();
            error.message = `idTeacher not found`;
            error.status = 404;
            throw error;
        }
    } catch (e) {
        next(e);
    }
}

export const updateBluetoothAddress = async (req, res, next) => {
    try {
        const { bluetoothAddress } = req.body;
        const connect = connectDB.connect;
        if (!bluetoothAddress) {
            let error = new Error();
            error.message = "bluetoothAddress is required";
            error.status = 400;
            throw error;
        }
        const regexCheckBluetoothAddress = /([0-9A-F]{2}):([0-9A-F]{2}):([0-9A-F]{2}):([0-9A-F]{2}):([0-9A-F]{2}):([0-9A-F]{2})/

        const regex = new RegExp(regexCheckBluetoothAddress)

        if (!regex.test(bluetoothAddress)) {
            let error = new Error();
            error.message = "bluetoothAddress incorrect format (ex: 12:12:12:12:12:12)";
            error.status = 400;
            throw error;
        }
        const { idUser } = req.decode;
        const queryUpdateMacId = `update teacher set bluetoothAddress = '${bluetoothAddress}' where idUser=${idUser}`;
        const { rowsAffected } = await connect.query(queryUpdateMacId)
        console.log("query ", queryUpdateMacId);
        if (rowsAffected > 0) {
            res.status(200).send({
                message: "Update bluetooth address success"
            })
        } else {
            let error = new Error();
            error.message = "Update bluetooth address fail";
            error.status = 500;
            throw error;
        }
    } catch (e) {
        next(e);
    }
}

export const getListClass = async (req, res, next) => {
    try {
        const connect = connectDB.connect;
        const { idUser } = req.decode;

        const queryCheckIdTeacher = `SELECT * FROM teacher where idUser = '${idUser}'`

        const { recordset: recordsetCheckIdTeacher } = await connect.query(queryCheckIdTeacher);

        if (recordsetCheckIdTeacher.length <= 0) {
            let error = new Error();
            error.message = "idTeacher not found";
            error.status = 500;
            throw error;
        }

        const queryGetData = `SELECT cc.idCreditClass,sb.subjectName,sb.numberOfCredits,s.day,s.startTime,s.period, r.roomName,cc.startDate,cc.endDate,t.bluetoothAddress,u.email,u.firstName,u.lastName,u.gender,u.dateOfBirth,u.image FROM dbo.credit_class cc JOIN dbo.credit_class_schedule ccs ON ccs.idCreditClass = cc.idCreditClass JOIN dbo.schedule s ON s.idSchedule = ccs.idSchedule JOIN dbo.room r ON r.idRoom = cc.idRoom  JOIN dbo.subject sb ON sb.idSubject = cc.idSubject JOIN dbo.teacher t ON t.idTeacher = cc.idTeacher JOIN dbo.[user] u ON u.idUser = t.idUser WHERE cc.idTeacher = '${recordsetCheckIdTeacher[0].idTeacher}' and cc.isDelete = 0 `

        const { recordset } = await connect.query(queryGetData);

        if (recordset.length > 0) {
            const arrayDifferent = [{ ...recordset[0] }];

            for (let i = 1; i < recordset.length; i++) {
                let isHave = false;
                for (let j = 0; j < arrayDifferent.length; j++) {
                    if (recordset[i].idCreditClass === arrayDifferent[j].idCreditClass) {
                        isHave = true;
                    }
                }
                if (!isHave) {
                    const arrayTemp = { ...recordset[i] }
                    arrayDifferent.push(arrayTemp)
                }

            }

            for (let i = 0; i < arrayDifferent.length; i++) {
                const temp = arrayDifferent[i].day;
                arrayDifferent[i].day = [temp];
                arrayDifferent[i].startTime = [arrayDifferent[i].startTime];
                arrayDifferent[i].period = [arrayDifferent[i].period];
                arrayDifferent[i].idSchedule = [arrayDifferent[i].idSchedule];
            }
            for (let i = 0; i < arrayDifferent.length; i++) {

                for (let j = 0; j < recordset.length; j++) {
                    if (arrayDifferent[i].idCreditClass === recordset[j].idCreditClass) {
                        const resultDay = findKey(arrayDifferent, (item) => {

                            return item.day.indexOf(recordset[j].day) === -1 || item.startTime.indexOf(recordset[j].startTime) === -1

                        })
                        if (resultDay) {
                            const tempArrayDay = [...arrayDifferent[i].day];
                            tempArrayDay.push(recordset[j].day);
                            arrayDifferent[i].day = tempArrayDay;

                            const tempArrayStartTime = [...arrayDifferent[i].startTime];
                            tempArrayStartTime.push(recordset[j].startTime);
                            arrayDifferent[i].startTime = tempArrayStartTime;

                        }

                        const resultPeriod = findKey(arrayDifferent, (item) => {
                            return item.period.indexOf(recordset[j].period) === -1

                        })

                        if (resultPeriod) {
                            const tempArrayPeriod = [...arrayDifferent[i].period];
                            tempArrayPeriod.push(recordset[j].period);
                            arrayDifferent[i].period = tempArrayPeriod;

                        }


                        const resultIdSchedule = findKey(arrayDifferent, (item) => {
                            return item.idSchedule.indexOf(recordset[j].idSchedule) === -1

                        })

                        if (resultIdSchedule) {
                            const tempArrayIdSchedule = [...arrayDifferent[i].idSchedule];
                            tempArrayIdSchedule.push(recordset[j].idSchedule);
                            arrayDifferent[i].idSchedule = tempArrayIdSchedule;

                        }

                    }
                }
            }
            for (let i = 0; i < arrayDifferent.length; i++) {
                arrayDifferent[i].day.splice(0, 1)
                arrayDifferent[i].startTime.splice(0, 1)
                arrayDifferent[i].idSchedule.splice(0, 1)
            }

            const resultArray = [...arrayDifferent];

            for (let i = 0; i < resultArray.length; i++) {
                for (let j = 0; j < resultArray[i].day.length; j++) {
                    switch (resultArray[i].day[j]) {
                        case 1: resultArray[i].day[j] = 'Sunday'; break;
                        case 2: resultArray[i].day[j] = 'Monday'; break;
                        case 3: resultArray[i].day[j] = 'Tuesday'; break;
                        case 4: resultArray[i].day[j] = 'Wednesday'; break;
                        case 5: resultArray[i].day[j] = 'Thursday'; break;
                        case 6: resultArray[i].day[j] = 'Friday'; break;
                        case 7: resultArray[i].day[j] = 'Saturday'; break;
                    }
                }

                for (let k = 0; k < resultArray[i].startTime.length; k++) {
                    if (resultArray[i].startTime[k] >= 12) {
                        resultArray[i].startTime[k] = {
                            session: "afternoon",
                            time: resultArray[i].startTime[k]
                        }
                    } else {
                        resultArray[i].startTime[k] = {
                            session: "morning",
                            time: resultArray[i].startTime[k]
                        }
                    }
                }
            }

            res.status(200).send({
                message: "Get list class success",
                result: arrayDifferent
            })
        } else {
            let error = new Error();
            error.message = "Get list class fail";
            error.status = 500;
            throw error;
        }

    } catch (e) {
        next(e);
    }
}

export const getListStudent = async (req, res, next) => {
    try {
        const { idCreditClass } = req.params;
        const connect = connectDB.connect;
        const queryCheckCreditClass = `SELECT * FROM credit_class where idCreditClass = ${idCreditClass} and isDelete = 0`;

        const { recordset: recordsetCheckData } = await connect.query(queryCheckCreditClass)
        if (recordsetCheckData.length <= 0) {
            let error = new Error();
            error.message = "idCreditClass not found";
            error.status = 404;
            throw error;
        }
        const query = ` SELECT u.firstName,u.lastName,s.idStudent FROM dbo.course_registration cr JOIN dbo.student s ON s.idStudent = cr.idStudent JOIN dbo.[user] u ON u.idUser = s.idUser WHERE cr.idCreditClass = ${idCreditClass} and cr.isDelete =0`;

        const { recordset } = await connect.query(query)

        if (recordset.length > 0) {
            res.status(200).send({
                message: "Get list student success",
                result: recordset
            })
        } else {
            let error = new Error();
            error.message = "list student not found";
            error.status = 404;
            throw error;
        }
    } catch (e) {
        next(e);
    }
}

export const attendance = async (req, res, next) => {
    try {
        const { idCreditClass, idStudent, isOffline, timeAttendance } = req.body;

        const connect = connectDB.connect;
        if (!idCreditClass || !idStudent) {
            let error = new Error();
            error.message = "    and idStudent is required";
            error.status = 400;
            throw error;
        }


        if (typeof idStudent !== "object" || idStudent.length <= 0) {
            let error = new Error();
            error.message = "idStudent must a array";
            error.status = 400;
            throw error;
        }



        const queryCheck = `SELECT  cc.startDate,cc.endDate, s.day, s.startTime,s.period, cr.idStudent FROM dbo.course_registration cr JOIN dbo.credit_class cc ON cc.idCreditClass = cr.idCreditClass JOIN dbo.credit_class_schedule ccs ON ccs.idCreditClass = cc.idCreditClass JOIN dbo.schedule s ON s.idSchedule = ccs.idSchedule where cr.idCreditClass = ${idCreditClass} and cr.isDelete =0`;
        const { recordset: recordsetCheck } = await connect.query(queryCheck);
        if (recordsetCheck.length <= 0) {
            let error = new Error();
            error.message = "idCourseRegistration not found";
            error.status = 404;
            throw error;
        }
        console.log({ isOffline, timeAttendance })
        let currentDate = new Date();
        if (isOffline) {
            currentDate = new Date(timeAttendance)
        }

        // check attendance
        const queryCheckTimeAttendance = `SELECT at.dateAttendance,  cc.startDate,cc.endDate, s.day, s.startTime,s.period, cr.idStudent FROM dbo.course_registration cr JOIN dbo.credit_class cc ON cc.idCreditClass = cr.idCreditClass JOIN dbo.credit_class_schedule ccs ON ccs.idCreditClass = cc.idCreditClass JOIN attendance at on at.idCreditClass = cc.idCreditClass JOIN dbo.schedule s ON s.idSchedule = ccs.idSchedule JOIN attendance a on a.idCreditClass = cc.idCreditClass where cr.idCreditClass = ${idCreditClass} and cr.isDelete =0`;
        const { recordset: recordsetCheckTimeAttendance } = await connect.query(queryCheckTimeAttendance);

        if (recordsetCheckTimeAttendance.length > 0) {
            for (let i = 0; i < recordsetCheckTimeAttendance.length; i++) {
                if (DateUtil.setHourMinute(+recordsetCheckTimeAttendance[i].dateAttendance, 0, 0, 0, 0) === DateUtil.setHourMinute(currentDate, 0, 0, 0, 0)) {
                    if (currentDate.getHours() + 7 <= 12 && new Date(+recordsetCheckTimeAttendance[i].dateAttendance).getHours() + 7 <= 12) {
                        let error = new Error();
                        error.message = "This class has been attendance"
                        error.status = 400;
                        throw error;
                    }
                    if (currentDate.getHours() + 7 > 12 && new Date(+recordsetCheckTimeAttendance[i].dateAttendance).getHours() + 7 > 12) {
                        let error = new Error();
                        error.message = "This class has been attendance"
                        error.status = 400;
                        throw error;
                    }
                }
            }

        }

        const arrayDifferent = [{ ...recordsetCheck[0] }];

        for (let i = 1; i < recordsetCheck.length; i++) {
            let isHave = false;
            for (let j = 0; j < arrayDifferent.length; j++) {
                if (recordsetCheck[i].idCreditClass === arrayDifferent[j].idCreditClass) {
                    isHave = true;
                }
            }
            if (!isHave) {
                const arrayTemp = { ...recordsetCheck[i] }
                arrayDifferent.push(arrayTemp)
            }

        }

        for (let i = 0; i < arrayDifferent.length; i++) {
            const temp = arrayDifferent[i].day;
            arrayDifferent[i].day = [temp];
            arrayDifferent[i].startTime = [arrayDifferent[i].startTime];
            arrayDifferent[i].period = [arrayDifferent[i].period];
            arrayDifferent[i].idStudent = [arrayDifferent[i].idStudent];
        }
        for (let i = 0; i < arrayDifferent.length; i++) {

            for (let j = 0; j < recordsetCheck.length; j++) {
                if (arrayDifferent[i].idCreditClass === recordsetCheck[j].idCreditClass) {
                    const resultDay = findKey(arrayDifferent, (item) => {

                        return item.day.indexOf(recordsetCheck[j].day) === -1 || item.startTime.indexOf(recordsetCheck[j].startTime) === -1

                    })
                    if (resultDay) {
                        const tempArrayDay = [...arrayDifferent[i].day];
                        tempArrayDay.push(recordsetCheck[j].day);
                        arrayDifferent[i].day = tempArrayDay;

                        const tempArrayStartTime = [...arrayDifferent[i].startTime];
                        tempArrayStartTime.push(recordsetCheck[j].startTime);
                        arrayDifferent[i].startTime = tempArrayStartTime;

                    }

                    const resultPeriod = findKey(arrayDifferent, (item) => {
                        return item.period.indexOf(recordsetCheck[j].period) === -1

                    })

                    if (resultPeriod) {
                        const tempArrayPeriod = [...arrayDifferent[i].period];
                        tempArrayPeriod.push(recordsetCheck[j].period);
                        arrayDifferent[i].period = tempArrayPeriod;

                    }

                    const resultIdStudent = findKey(arrayDifferent, (item) => {
                        return item.idStudent.indexOf(recordsetCheck[j].idStudent) === -1

                    })

                    if (resultIdStudent) {
                        const tempArrayIdStudent = [...arrayDifferent[i].idStudent];
                        tempArrayIdStudent.push(recordsetCheck[j].idStudent);
                        arrayDifferent[i].idStudent = tempArrayIdStudent;

                    }

                }
            }
        }

        const { startDate, endDate, day, startTime, period, idStudent: idStudentInClass } = arrayDifferent[0];
        console.log("endate ", endDate)
        if (+startDate > currentDate.getTime()) {
            let error = new Error();
            error.message = "This class has not started yet"
            error.status = 400;
            throw error;
        }
        if (+endDate < currentDate.getTime()) {
            let error = new Error();
            error.message = "This class has ended"
            error.status = 400;
            throw error;
        }

        let isHaveDay = false

        for (let i = 0; i < day.length; i++) {

            if (+day[i] === currentDate.getDay() + 1) {
                isHaveDay = true;
            }
        }
        if (!isHaveDay) {
            let error = new Error();
            error.message = "This class not start"
            error.status = 400;
            throw error;
        }
        let isHaveStartTime = false;
        console.log("curernt datyr ", currentDate.getHours());
        console.log("startTime ", startTime);
        console.log("period ", period)
        let isHaveEndTime = false;
        for (let i = 0; i < startTime.length; i++) {
            if (+startTime[i] < currentDate.getHours() + 7) {
                isHaveStartTime = true;
            }

            const endTime = Math.round((+period[0] * 45 + (+period[0] / 4) * 30) / 60) + +startTime[i];
            console.log("endtime ", endTime)
            if (+endTime > currentDate.getHours() + 7) {
                isHaveEndTime = true
            }
        }
        if (!isHaveStartTime) {
            let error = new Error();
            error.message = "This class not start"
            error.status = 400;
            throw error;
        }


        if (!isHaveEndTime) {
            let error = new Error();
            error.message = "This class ended"
            error.status = 400;
            throw error;
        }



        for (let i = 0; i < idStudent.length; i++) {
            let isHave = false;
            for (let j = 0; j < idStudentInClass.length; j++) {

                if (idStudent[i] === idStudentInClass[j]) {
                    isHave = true
                }
            }
            if (!isHave) {
                let error = new Error();
                error.message = `student ${idStudent[i]} is not on the list`
                error.status = 400;
                throw error;
            }
        }




        for (let i = 0; i < idStudent.length; i++) {
            const query = `INSERT INTO attendance(idStudent, idCreditClass, dateAttendance) 
                        values('${idStudent[i]}', ${idCreditClass}, ${currentDate.getTime()})`
            const { rowsAffected } = await connect.query(query);
            if (rowsAffected <= 0) {
                let error = new Error();
                error.message = "attendance fail for student " + idStudent[i];
                error.status = 400;
                throw error;
            }
        }

        res.status(200).send({
            message: "Attendance success"
        })

    } catch (e) {
        console.log("error ", e)
        next(e);
    }
}

export const getTimeTable = async (req, res, next) => {
    try {

        const connect = connectDB.connect;

        const { idUser } = req.decode;

        const query = `SELECT s.subjectName AS title,cc.startDate,cc.endDate,sd.startTime, sd.day ,sd.period,
        u.firstName AS first_name_teacher,u.lastName AS last_name_teacher, r.roomName 
        as location FROM  dbo.credit_class cc JOIN dbo.subject s ON
        s.idSubject = cc.idSubject JOIN dbo.teacher t ON t.idTeacher = cc.idTeacher
        JOIN dbo.credit_class_schedule ccs ON ccs.idCreditClass = cc.idCreditClass JOIN dbo.schedule sd ON
        sd.idSchedule = ccs.idSchedule JOIN dbo.room r ON r.idRoom = cc.idRoom
        JOIN dbo.[user] u ON u.idUser = t.idUser WHERE u.idUser = ${idUser} AND u.isDelete  = 0 AND cc.isDelete = 0`

        console.log("query ", query)

        const { recordset } = await connect.query(query);

        if (recordset.length > 0) {
            for (let i = 0; i < recordset.length; i++) {
                switch (recordset[i].day) {
                    case 1: recordset[i].day = 'SUN'; break;
                    case 2: recordset[i].day = 'MON'; break;
                    case 3: recordset[i].day = 'TUE'; break;
                    case 4: recordset[i].day = 'WED'; break;
                    case 5: recordset[i].day = 'THU'; break;
                    case 6: recordset[i].day = 'FRI'; break;
                    case 7: recordset[i].day = 'SAT'; break;
                }
                recordset[i].endTime = Math.round((+recordset[i].period * 45 + (+recordset[i].period / 4) * 30) / 60) + +recordset[i].startTime;

            }

            res.status(200).send({
                message: "Get time table success",
                result: recordset
            })

        } else {
            let error = new Error();
            error.message = `Cannot found time table`;
            error.status = 404;
            throw error;
        }
    } catch (e) {
        next(e)
    }
}

export const getHistoryAttendanceByClass = async (req, res, next) => {
    try {
        const connect = connectDB.connect;

        const { idCreditClass } = req.params;

        const queryGetListDate = `SELECT DISTINCT dateAttendance FROM dbo.attendance where idCreditClass = ${idCreditClass}`;

        const { recordset: recordsetGetList } = await connect.query(queryGetListDate)

        if (recordsetGetList.length <= 0) {
            let error = new Error();
            error.message = `Attendance not found`;
            error.status = 404;
            throw error;
        }


        let resultArray = [];
        for (let k = 0; k < recordsetGetList.length; k++) {
            const query = `SELECT a.idStudent,cc.idCreditClass,a.dateAttendance,s.subjectName,'true' AS roll_call , u.firstName, u.lastName 
                            FROM dbo.attendance a JOIN dbo.credit_class cc ON cc.idCreditClass = a.idCreditClass JOIN student st ON st.idStudent = a.idStudent JOIN [user] u ON u.idUser = st.idUser JOIN
                            dbo.subject s ON  s.idSubject = cc.idSubject WHERE a.idCreditClass = ${idCreditClass} AND 
                            a.dateAttendance = ${recordsetGetList[k].dateAttendance}
                            UNION
                            SELECT cr.idStudent,cc.idCreditClass, NULL, s.subjectName, 'false' AS 
                            roll_call , u.firstName, u.lastName  FROM dbo.course_registration cr JOIN student st ON st.idStudent = cr.idStudent JOIN [user] u ON u.idUser = st.idUser JOIN dbo.credit_class cc ON 
                            cc.idCreditClass = cr.idCreditClass JOIN dbo.subject s ON s.idSubject =
                             cc.idSubject WHERE cr.idCreditClass = ${idCreditClass} AND  cr.idStudent NOT IN
                            (SELECT idStudent FROM dbo.attendance WHERE idCreditClass = ${idCreditClass} 
                                AND dateAttendance = ${recordsetGetList[k].dateAttendance}  )`;
            const { recordset } = await connect.query(query);

            if (recordset.length > 0) {

                resultArray.push(recordset)

            } else {
                let error = new Error();
                error.message = `Get history attendance fail`;
                error.status = 500;
                throw error;
            }
        }

        const finishData = [];

        const listIdStudent = [];
        for (let i = 0; i < resultArray.length; i++) {
            let temp = [];
            for (let j = 0; j < resultArray[i].length; j++) {
                temp.push({
                    idStudent: resultArray[i][j].idStudent,
                    roll_call: resultArray[i][j].roll_call,
                    firstName: resultArray[i][j].firstName,
                    lastName: resultArray[i][j].lastName,
                })
            }
            listIdStudent.push(temp)
        }

        for (let i = 0; i < resultArray.length; i++) {
            let temp = {
                dateAttendance: resultArray[i][0].dateAttendance,
                subjectName: resultArray[i][0].subjectName,
                listStudent: listIdStudent[i],

            }
            finishData.push(temp)
        }

        res.status(200).send({
            message: "Get history attendance success",
            result: finishData
        })


    } catch (e) {
        next(e)
    }
}

export const updateHistoryAttendance = async (req, res, next) => {
    try {
        const connect = connectDB.connect;
        const data = req.body;
        const { idCreditClass } = req.params;
        const currentDate = new Date().getTime();
        if (data.length > 0) {

            const queryCheckCreditClass = `SELECT * FROM credit_class where idCreditClass = ${idCreditClass} and isDelete = 0`;

            const { recordset: recordsetCreditClass } = await connect.query(queryCheckCreditClass);
            if (recordsetCreditClass.length <= 0) {
                let error = new Error();
                error.message = "idCreditClass not found";
                error.status = 404;
                throw error;
            }

            const queryDelete = `DELETE attendance where idCreditClass = ${idCreditClass}`;

            const { rowsAffected: rowsAffectedDelete } = await connect.query(queryDelete);

            if (rowsAffectedDelete > 0) {

                for (let i = 0; i < data.length; i++) {
                    for (let j = 0; j < data[i].listStudent.length; j++) {
                        if (data[i].listStudent[j].roll_call === 'true') {
                            const query = `Insert into attendance(idStudent,idCreditClass, dateAttendance) values('${data[i].listStudent[j].idStudent}',${idCreditClass},${data[i].dateAttendance})`

                            const { rowsAffected } = await connect.query(query);

                            if (rowsAffected < 0) {
                                let error = new Error();
                                error.message = "Insert new attendance fail";
                                error.status = 500;
                                throw error;
                            }
                        }
                    }
                }

                res.status(200).send({
                    message: "Update attendance success"
                })

            } else {
                let error = new Error();
                error.message = "Delete old attendance fail";
                error.status = 500;
                throw error;
            }

        } else {
            let error = new Error();
            error.message = "data is empty";
            error.status = 400;
            throw error;
        }

    } catch (e) {
        next(e);
    }
}