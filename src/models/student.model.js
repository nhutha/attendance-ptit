import bcrypt from "bcrypt";
import appRoot from "app-root-path";

import TypeRole from "../constants/TypeRole";
import connectDB from "../utils/connectDB";
import { changeFileName, deleteFile } from "../utils/file";
import { DateUtil } from "../utils/date-utils";


export const createStudent = async (req, res, next) => {
    let avatar = '';
    try {
        const connect = connectDB.connect;

        const { email, firstName, lastName, gender, dateOfBirth, idClass } = req.body;

        if (!email || !firstName || !gender || !lastName || !dateOfBirth || !idClass) {
            let error = new Error();
            error.message = "email, gender, firstName, lastName, idClass and dateOfBirth is required";
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

        const queryGetRoleAdmin = `SELECT * FROM role where roleName = '${TypeRole.STUDENT}'`


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

            const query = `EXEC dbo.sp_createStudent @email = '${email}', @firstName = N'${firstName}', @lastName = N'${lastName}', @gender='${gender}', @dateOfBirth =${dateOfBirth}, @idClass ='${idClass}', @image ='${avatar}', @code = '${codeChangePasswordHash}' `;


            const { recordset: recordsetCreate, rowsAffected: rowsAffectedCreate } = await connect.query(query);
            if (rowsAffectedCreate.length > 0) {
                res.status(200).send({
                    message: "Create student success",
                    result: recordsetCreate[0]
                })

            } else {
                let error = new Error();
                error.message = "Create student fail";
                error.status = 500;
                throw error;
            }
        } else {
            let error = new Error();
            error.message = "Role student not found";
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

export const updateStudent = async (req, res, next) => {
    let avatar = '';
    try {

        const { idStudent } = req.params;
        const connect = connectDB.connect;

        const queryCheckIdStudent = `SELECT u.*, s.idClass FROM student s JOIN [user] u ON s.idUser = u.idUser where s.idStudent = '${idStudent}' and s.isDelete = 0`;

        const { recordset: recordsetCheckIdStudent } = await connect.query(queryCheckIdStudent);

        if (recordsetCheckIdStudent.length > 0) {

            const studentFound = recordsetCheckIdStudent[0];
            let { email, firstName, lastName, gender, dateOfBirth, idClass, idRole } = req.body;

            if (!email) {
                email = studentFound.email;
            }

            if (!firstName) {
                firstName = studentFound.firstName
            } else {
                if (firstName.length > 10) {
                    let error = new Error();
                    error.message = `firstName have maximum 10 character`;
                    error.status = 400;
                    throw error;
                }
            }

            if (!lastName) {
                lastName = studentFound.lastName
            }

            if (!gender) {
                gender = studentFound.gender
            }

            if (!dateOfBirth) {
                dateOfBirth = studentFound.dateOfBirth
            }

            if (!idClass) {
                idClass = studentFound.idClass
            }

            if (!idRole) {
                idRole = studentFound.idRole
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



            const queryUpdate = `EXEC dbo.sp_updateStudent @email = '${email}', @firstName = N'${firstName}', @lastName = N'${lastName}', @gender='${gender}', @dateOfBirth =${dateOfBirth}, @idClass ='${idClass}', @image ='${avatar}', @idRole = ${idRole}, @idStudent = '${idStudent}'`;
            const { recordset: recordsetUpdate, rowsAffected: rowsAffectedUpdate } = await connect.query(queryUpdate);
            if (rowsAffectedUpdate.length > 0) {

                res.status(200).send({
                    message: `Update student ${lastName} ${firstName} success`,
                    result: recordsetUpdate[0]
                })

            } else {
                let error = new Error();
                error.message = `Update student fail`;
                error.status = 400;
                throw error;
            }

        } else {
            let error = new Error();
            error.message = `idStudent not found`;
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

export const deleteStudent = async (req, res, next) => {
    try {
        const { idStudent } = req.params;
        const connect = connectDB.connect;
        const queryCheckIdStudent = `SELECT * FROM student s join [user] u on s.idUser = u.idUser where s.idStudent = '${idStudent}' and s.isDelete = 0`;

        const { recordset: recordsetCheckIdStudent } = await connect.query(queryCheckIdStudent);
        if (recordsetCheckIdStudent.length > 0) {

            const studentFound = recordsetCheckIdStudent[0];


            const queryDeleteStudent = `EXEC dbo.sp_deleteStudent @idStudent = ${idStudent}`
            const { rowsAffected: rowsAffectedDeleteStudent } = await connect.query(queryDeleteStudent);

            if (rowsAffectedDeleteStudent.length > 0) {

                res.status(200).send({
                    message: `Delete student ${studentFound.lastName} ${studentFound.firstName} success`
                })

            } else {
                let error = new Error();
                error.message = `delete student ${studentFound.lastName} ${studentFound.firstName} fail`;
                error.status = 500;
                throw error;
            }
        } else {
            let error = new Error();
            error.message = `idStudent not found`;
            error.status = 404;
            throw error;
        }

    } catch (e) {
        next(e)
    }
}

export const getStudentById = async (req, res, next) => {
    try {
        const { idStudent } = req.params;
        const connect = connectDB.connect;
        const query = `SELECT s.idStudent,s.idClass,c.className ,u.email,u.firstName,u.lastName,u.gender,u.dateOfBirth,u.image,u.idUser from [user] u join student s on u.idUser = s.idUser JOIN class c on c.idClass = s.idClass where s.idStudent = '${idStudent}' and s.isDelete = 0`
        const { recordset } = await connect.query(query);

        if (recordset.length > 0) {
            res.status(200).send({
                message: `Get student ${idStudent} success`,
                result: recordset[0]
            })
        } else {
            let error = new Error();
            error.message = `idStudent not found`;
            error.status = 404;
            throw error;
        }

    } catch (e) {
        next(e);
    }
}

export const getListStudent = async (req, res, next) => {
    try {
        const connect = connectDB.connect;

        const query = `SELECT s.idStudent,s.idClass,c.className ,u.email,u.firstName,u.lastName,u.gender,u.dateOfBirth,u.image,u.idUser from [user] u join student s on u.idUser = s.idUser JOIN class c on c.idClass = s.idClass where s.isDelete = 0`
        const { recordset } = await connect.query(query);

        if (recordset.length > 0) {

            res.status(200).send({
                message: `Get list student success`,
                result: recordset
            })
        } else {
            let error = new Error();
            error.message = `idStudent not found`;
            error.status = 404;
            throw error;
        }
    } catch (e) {
        next(e);
    }
}

export const getBluetoothAddressOfTeacher = async (req, res, next) => {
    try {
        const currentDate = new Date();

        const connect = connectDB.connect;

        const dateAddTimezone = new Date(DateUtil.addTimeWithOffsetAndTimezone(currentDate, 7));
        const currentDay = dateAddTimezone.getDay() + 1;

        const currentTime = dateAddTimezone.getTime();

        const currentHours = dateAddTimezone.getHours();

        console.log("get time ", currentTime)

        console.log("time ", new Date().getTime())

        const { idUser } = req.decode

        const query = ` SELECT cc.idTeacher, cc.startDate,cc.endDate, t.bluetoothAddress , s.startTime, s.period
        FROM dbo.schedule s JOIN dbo.credit_class_schedule ccs ON ccs.idSchedule =
        s.idSchedule JOIN dbo.credit_class cc ON cc.idCreditClass = ccs.idCreditClass JOIN course_registration cr on cr.idCreditClass = cc.idCreditClass
		JOIN student st ON st.idStudent = cr.idStudent JOIN [user] u on u.idUser = st.idUser
        JOIN dbo.teacher t ON t.idTeacher = cc.idTeacher WHERE day = ${currentDay} AND
        cc.startDate <= ${currentTime} AND cc.endDate >= ${currentTime} AND cc.isDelete = 0
        and u.idUser = ${idUser} and s.startTime <= ${currentHours}`

        console.log("query ", query)
        const { recordset } = await connect.query(query)
        if (recordset.length > 0) {


            for (let i = 0; i < recordset.length; i++) {

                const endTime = Math.round((+recordset[i].period * 45 + (+recordset[i].period / 4) * 30) / 60) + +recordset[i].startTime;
                if (endTime >= currentHours) {
                    res.status(200).send({
                        message: "Get bluetooth address success",
                        result: recordset[i]
                    })
                    return
                }
            }

            res.status(404).send({
                message: "No class now",
            })

        } else {
            let error = new Error();
            error.message = `It is not time to take attendance yet`;
            error.status = 404;
            throw error;
        }


    } catch (e) {
        next(e)
    }
}

export const getTimeTable = async (req, res, next) => {
    try {

        const connect = connectDB.connect;

        const { idUser } = req.decode;

        const query = `SELECT s.subjectName AS title,cc.startDate,cc.endDate,sd.startTime, sd.day ,sd.period,u.firstName AS first_name_teacher,u.lastName AS last_name_teacher, r.roomName as location FROM dbo.course_registration cr JOIN dbo.credit_class cc ON cc.idCreditClass = cr.idCreditClass JOIN dbo.subject s ON 
        s.idSubject = cc.idSubject JOIN dbo.teacher t ON t.idTeacher = cc.idTeacher
         JOIN dbo.credit_class_schedule ccs ON ccs.idCreditClass = cc.idCreditClass JOIN dbo.schedule sd ON 
         sd.idSchedule = ccs.idSchedule JOIN dbo.room r ON r.idRoom = cc.idRoom JOIN dbo.student st ON  st.idStudent = cr.idStudent  JOIN dbo.[user] u2 ON u2.idUser = st.idUser 
         JOIN dbo.[user] u ON u.idUser = t.idUser WHERE u2.idUser = ${idUser} AND u2.isDelete  = 0 `

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