import { findKey, uniq } from "lodash"

import connectDB from "../utils/connectDB";

export const createCourseRegistration = async (req, res, next) => {
    try {
        const connect = connectDB.connect;

        const { idStudent, idCreditClass } = req.body;

        if (!idStudent || !idCreditClass) {
            let error = new Error();
            error.message = "idStudent and idCreditClass is required";
            error.status = 400;
            throw error;
        }

        if (typeof idStudent !== 'object' && idStudent.length <= 0) {
            let error = new Error();
            error.message = "idStudent must a array";
            error.status = 400;
            throw error;
        }

        for (let i = 0; i < idStudent.length; i++) {
            const queryCheckStudent = `SELECT * FROM student where idStudent = '${idStudent[i]}' and isDelete = 0`;

            const { recordset: recordsetStudent } = await connect.query(queryCheckStudent);
            if (recordsetStudent.length <= 0) {
                let error = new Error();
                error.message = `idStudent ${idStudent[i]} not found`;
                error.status = 404;
                throw error;
            }
        }

        const queryCheckCreditClass = `SELECT ccs.idSchedule FROM dbo.credit_class cc JOIN dbo.credit_class_schedule ccs ON ccs.idCreditClass = cc.idCreditClass  where cc.idCreditClass = ${idCreditClass} and cc.isDelete = 0`;

        const { recordset: recordsetCreditClass } = await connect.query(queryCheckCreditClass);
        if (recordsetCreditClass.length <= 0) {
            let error = new Error();
            error.message = "idCreditClass not found";
            error.status = 404;
            throw error;
        }

        for (let i = 0; i < idStudent.length; i++) {
            const checkData = `SELECT * FROM course_registration where idStudent ='${idStudent[i]}' and idCreditClass = ${idCreditClass}`;

            const { recordset: recordsetCheckData } = await connect.query(checkData);

            if (recordsetCheckData.length > 0) {
                let error = new Error();
                error.message = `idStudent ${idStudent[i]} and idCreditCLass already exits`;
                error.status = 404;
                throw error;
            }
        }

        // check student

        for (let i = 0; i < idStudent.length; i++) {
            const queryCheckTimeStudent = `SELECT cr.idStudent, cc.startDate,cc.endDate, ccs.idSchedule FROM dbo.credit_class cc JOIN dbo.credit_class_schedule ccs ON ccs.idCreditClass = cc.idCreditClass JOIN dbo.course_registration cr ON cr.idCreditClass = cc.idCreditClass where cr.idStudent = '${idStudent[i]}' and cr.isDelete = 0`;

            const { recordset: recordsetCheckTimeStudent } = await connect.query(queryCheckTimeStudent)

            if (recordsetCheckTimeStudent.length > 0) {
                for (let j = 0; j < recordsetCheckTimeStudent.length; j++) {
                    if (recordsetCheckTimeStudent[j].idSchedule === queryCheckCreditClass[0].idSchedule) {
                        let error = new Error();
                        error.message = `idStudent ${idStudent[i]} has a class in this time`;
                        error.status = 404;
                        throw error;
                    }
                }
            }
        }

        for (let i = 0; i < idStudent.length; i++) {
            const queryCreate = `INSERT INTO course_registration(idStudent, idCreditClass) values ('${idStudent[i]}', ${idCreditClass})`;

            const { rowsAffected } = await connect.query(queryCreate);
            if (rowsAffected <= 0) {
                let error = new Error();
                error.message = "Create course registration fail";
                error.status = 500;
                throw error;
            }
        }
        res.status(200).send({
            message: "Create course registration success"
        })


    } catch (e) {
        next(e);
    }
}

export const updateCourseRegistration = async (req, res, next) => {
    try {
        const connect = connectDB.connect;
        const { idCreditClass } = req.params;
        const { idStudent } = req.body;
        if (!idStudent) {
            let error = new Error();
            error.message = "idStudent is required";
            error.status = 400;
            throw error;
        }

        if (typeof idStudent !== 'object' && idStudent.length <= 0) {
            let error = new Error();
            error.message = "idStudent is required";
            error.status = 400;
            throw error;
        }

        for (let i = 0; i < idStudent.length; i++) {
            const queryCheckStudent = `SELECT * FROM student where idStudent = '${idStudent[i]}' and isDelete = 0`;

            const { recordset: recordsetStudent } = await connect.query(queryCheckStudent);

            if (recordsetStudent.length <= 0) {
                let error = new Error();
                error.message = `idStudent ${idStudent[i]} not found`;
                error.status = 404;
                throw error;
            }
        }

        const queryCheckCourseRegistration = `SELECT * FROM course_registration where idCreditClass = ${idCreditClass} `;

        const { recordset: recordsetCourseRegistration } = await connect.query(queryCheckCourseRegistration);
        if (recordsetCourseRegistration.length <= 0) {
            let error = new Error();
            error.message = "idCreditClass not found";
            error.status = 404;
            throw error;
        }
        const courseRegistrationFound = recordsetCourseRegistration[0]

        const queryCheckCreditClass = `SELECT ccs.idSchedule FROM dbo.credit_class cc JOIN dbo.credit_class_schedule ccs ON ccs.idCreditClass = cc.idCreditClass  where cc.idCreditClass = ${idCreditClass} and cc.isDelete = 0`;

        const { recordset: recordsetCreditClass } = await connect.query(queryCheckCreditClass);
        if (recordsetCreditClass.length <= 0) {
            let error = new Error();
            error.message = "idCreditClass not found";
            error.status = 404;
            throw error;
        }

        // check student

        if (idStudent) {
            for (let i = 0; i < idStudent.length; i++) {
                const queryCheckTimeStudent = `SELECT cr.idStudent, cc.startDate,cc.endDate, ccs.idSchedule FROM dbo.credit_class cc JOIN dbo.credit_class_schedule ccs ON ccs.idCreditClass = cc.idCreditClass JOIN dbo.course_registration cr ON cr.idCreditClass = cc.idCreditClass where cr.idStudent = '${idStudent[i]}' and cr.isDelete = 0`;

                const { recordset: recordsetCheckTimeStudent } = await connect.query(queryCheckTimeStudent)

                if (recordsetCheckTimeStudent.length > 0) {
                    for (let j = 0; j < recordsetCheckTimeStudent.length; j++) {
                        if (recordsetCheckTimeStudent[j].idSchedule === queryCheckCreditClass[0].idSchedule) {
                            let error = new Error();
                            error.message = `idStudent ${idStudent[i]} has a class in this time`;
                            error.status = 404;
                            throw error;
                        }
                    }
                }
            }
        }

        const queryDelete = `Delete course_registration where idCreditClass = ${idCreditClass}`;

        const { rowsAffected: rowsAffectedDelete } = await connect.query(queryDelete);
        if (rowsAffectedDelete <= 0) {
            let error = new Error();
            error.message = "Delete old data fail";
            error.status = 500;
            throw error;
        }
        for (let i = 0; i < idStudent.length; i++) {
            const queryCreate = `INSERT INTO course_registration(idStudent, idCreditClass) values ('${idStudent[i]}', ${idCreditClass})`;
            console.log("query create ", queryCreate)
            const { rowsAffected } = await connect.query(queryCreate);
            if (rowsAffected <= 0) {
                let error = new Error();
                error.message = "Update course registration fail";
                error.status = 500;
                throw error;
            }
        }
        res.status(200).send({
            message: "Update course registration success"
        })

    } catch (e) {
        next(e);
    }
}

export const deleteCourseRegistration = async (req, res, next) => {
    try {
        const connect = connectDB.connect;
        const { idCreditClass } = req.params;
        const queryCheckCourseRegistration = `SELECT * FROM course_registration where idCreditClass = ${idCreditClass}`;

        const { recordset: recordsetCourseRegistration } = await connect.query(queryCheckCourseRegistration);
        if (recordsetCourseRegistration.length <= 0) {
            let error = new Error();
            error.message = "idCreditClass not found";
            error.status = 404;
            throw error;
        }

        const queryDelete = `delete course_registration where idCreditClass = ${idCreditClass}`;
        const { rowsAffected } = await connect.query(queryDelete);

        if (rowsAffected > 0) {
            res.status(200).send({
                message: "Delete course registration success"
            })
        } else {
            let error = new Error();
            error.message = "Delete course registration fail";
            error.status = 404;
            throw error;
        }
    } catch (e) {
        next(e);
    }
}

export const getCourseRegistration = async (req, res, next) => {
    try {
        const connect = connectDB.connect;
        const { idCourseRegistration } = req.params;
        const queryCheckCourseRegistration = `SELECT cc.idCreditClass, st.idStudent, u.email AS email_student,u.firstName AS first_name_student, u.lastName AS last_name_student, u.gender AS gender_student,u.dateOfBirth AS dateOfBirth_student, u.image AS image_student, 
        u2.email AS email_teacher,u2.firstName AS first_name_teacher, u2.lastName AS last_name_teacher, u2.gender AS gender_teacher,u2.dateOfBirth AS dateOfBirth_teacher, u2.image AS image_teacher, 
        r.roomName, sd.day, sd.startTime,sd.period,t.bluetoothAddress,cl.className
        FROM dbo.course_registration cr JOIN dbo.credit_class cc ON cc.idCreditClass = cr.idCreditClass JOIN 
        dbo.subject s ON s.idSubject = cc.idSubject JOIN dbo.room r ON r.idRoom = cc.idRoom JOIN dbo.credit_class_schedule ccs
         ON ccs.idCreditClass = cc.idCreditClass JOIN dbo.schedule sd ON sd.idSchedule = ccs.idSchedule JOIN dbo.teacher t
          ON t.idTeacher = cc.idTeacher JOIN dbo.student st ON st.idStudent = cr.idStudent JOIN dbo.[user] u 
          ON u.idUser = st.idUser JOIN dbo.[user] u2 ON u2.idUser = t.idUser JOIN dbo.class cl ON cl.idClass = st.idClass where cr.idCourseRegistration = ${idCourseRegistration} and cr.isDelete = 0 and st.isDelete = 0`;

        const { recordset: recordsetCourseRegistration } = await connect.query(queryCheckCourseRegistration);
        if (recordsetCourseRegistration.length <= 0) {
            let error = new Error();
            error.message = "idCourseRegistration not found";
            error.status = 404;
            throw error;
        }

        if (recordsetCourseRegistration.length > 1) {
            const arrayDifferent = [{ ...recordsetCourseRegistration[0] }];

            for (let i = 1; i < recordsetCourseRegistration.length; i++) {
                let isHave = false;
                for (let j = 0; j < arrayDifferent.length; j++) {
                    if (recordsetCourseRegistration[i].idCreditClass === arrayDifferent[j].idCreditClass) {
                        isHave = true;
                    }
                }
                if (!isHave) {
                    const arrayTemp = { ...recordsetCourseRegistration[i] }
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

                for (let j = 0; j < recordsetCourseRegistration.length; j++) {
                    if (arrayDifferent[i].idCreditClass === recordsetCourseRegistration[j].idCreditClass) {
                        const resultDay = findKey(arrayDifferent, (item) => {

                            return item.day.indexOf(recordsetCourseRegistration[j].day) === -1 || item.startTime.indexOf(recordsetCourseRegistration[j].startTime) === -1

                        })
                        if (resultDay) {
                            const tempArrayDay = [...arrayDifferent[i].day];
                            tempArrayDay.push(recordsetCourseRegistration[j].day);
                            arrayDifferent[i].day = tempArrayDay;

                            const tempArrayStartTime = [...arrayDifferent[i].startTime];
                            tempArrayStartTime.push(recordsetCourseRegistration[j].startTime);
                            arrayDifferent[i].startTime = tempArrayStartTime;

                        }

                        const resultPeriod = findKey(arrayDifferent, (item) => {
                            return item.period.indexOf(recordsetCourseRegistration[j].period) === -1

                        })

                        if (resultPeriod) {
                            const tempArrayPeriod = [...arrayDifferent[i].period];
                            tempArrayPeriod.push(recordsetCourseRegistration[j].period);
                            arrayDifferent[i].period = tempArrayPeriod;

                        }


                        const resultIdSchedule = findKey(arrayDifferent, (item) => {
                            return item.idSchedule.indexOf(recordsetCourseRegistration[j].idSchedule) === -1

                        })

                        if (resultIdSchedule) {
                            const tempArrayIdSchedule = [...arrayDifferent[i].idSchedule];
                            tempArrayIdSchedule.push(recordsetCourseRegistration[j].idSchedule);
                            arrayDifferent[i].idSchedule = tempArrayIdSchedule;

                        }

                    }
                }
            }
            // for (let i = 0; i < arrayDifferent.length; i++) {
            //     arrayDifferent[i].day.splice(0, 1)
            //     arrayDifferent[i].startTime.splice(0, 1)
            //     arrayDifferent[i].idSchedule.splice(0, 1)
            // }

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
                message: "Get course registration success",
                result: resultArray
            })
        } else if (recordsetCourseRegistration.length === 1) {
            res.status(200).send({
                message: "Get course registration success",
                result: recordsetCourseRegistration[0]
            })
        }



    } catch (e) {
        next(e);
    }
}

export const getListCourseRegistration = async (req, res, next) => {
    try {
        const connect = connectDB.connect;

        const queryCheckCourseRegistration = `SELECT DISTINCT sd.idSchedule, cc.idCreditClass, st.idStudent, u.email AS email_student,u.firstName AS first_name_student,
         u.lastName AS last_name_student, u.gender AS gender_student,u.dateOfBirth AS
          dateOfBirth_student, u.image AS image_student, s.subjectName,
        u2.email AS email_teacher,u2.firstName AS first_name_teacher, u2.lastName AS 
        last_name_teacher, u2.gender AS gender_teacher,u2.dateOfBirth AS dateOfBirth_teacher,
         u2.image AS image_teacher, 
        r.roomName, sd.day, sd.startTime,sd.period,t.bluetoothAddress,cl.className
        FROM dbo.course_registration cr JOIN dbo.credit_class cc ON cc.idCreditClass =
         cr.idCreditClass JOIN 
        dbo.subject s ON s.idSubject = cc.idSubject JOIN dbo.room r ON r.idRoom = cc.idRoom 
        JOIN dbo.credit_class_schedule ccs
         ON ccs.idCreditClass = cc.idCreditClass JOIN dbo.schedule sd ON sd.idSchedule = 
         ccs.idSchedule JOIN dbo.teacher t
          ON t.idTeacher = cc.idTeacher JOIN dbo.student st ON st.idStudent = cr.idStudent 
          JOIN dbo.[user] u 
          ON u.idUser = st.idUser JOIN dbo.[user] u2 ON u2.idUser = t.idUser JOIN dbo.class 
          cl ON cl.idClass = st.idClass where cr.isDelete = 0 and st.isDelete = 0`;

        const { recordset: recordsetCourseRegistration } = await connect.query(queryCheckCourseRegistration);
        if (recordsetCourseRegistration.length <= 0) {
            let error = new Error();
            error.message = "idCourseRegistration not found";
            error.status = 404;
            throw error;
        }
        const arrayDifferent = [{ ...recordsetCourseRegistration[0] }];

        for (let i = 1; i < recordsetCourseRegistration.length; i++) {
            let isHave = false;
            for (let j = 0; j < arrayDifferent.length; j++) {
                if (recordsetCourseRegistration[i].idCreditClass === arrayDifferent[j].idCreditClass) {
                    isHave = true;
                }
            }
            if (!isHave) {
                const arrayTemp = { ...recordsetCourseRegistration[i] }
                arrayDifferent.push(arrayTemp)
            }

        }

        for (let i = 0; i < arrayDifferent.length; i++) {
            const temp = arrayDifferent[i].day;
            arrayDifferent[i].day = [temp];
            arrayDifferent[i].startTime = [arrayDifferent[i].startTime];
            arrayDifferent[i].period = [arrayDifferent[i].period];
            arrayDifferent[i].idSchedule = [arrayDifferent[i].idSchedule];
            arrayDifferent[i].firstName = uniq(arrayDifferent[i].firstName);
            arrayDifferent[i].lastName = uniq(arrayDifferent[i].lastName);
            arrayDifferent[i].students = [{
                idStudent: arrayDifferent[i].idStudent,
                firstName: arrayDifferent[i].first_name_student,
                lastName: arrayDifferent[i].last_name_student
            }];


        }
        for (let i = 0; i < arrayDifferent.length; i++) {

            for (let j = 0; j < recordsetCourseRegistration.length; j++) {
                if (arrayDifferent[i].idCreditClass === recordsetCourseRegistration[j].idCreditClass) {
                    const resultDay = findKey(arrayDifferent, (item) => {

                        return item.day.indexOf(recordsetCourseRegistration[j].day) === -1 || item.startTime.indexOf(recordsetCourseRegistration[j].startTime) === -1

                    })
                    if (resultDay) {
                        const tempArrayDay = [...arrayDifferent[i].day];
                        tempArrayDay.push(recordsetCourseRegistration[j].day);
                        arrayDifferent[i].day = tempArrayDay;

                        const tempArrayStartTime = [...arrayDifferent[i].startTime];
                        tempArrayStartTime.push(recordsetCourseRegistration[j].startTime);
                        arrayDifferent[i].startTime = tempArrayStartTime;

                    }

                    const resultPeriod = findKey(arrayDifferent, (item) => {
                        return item.period.indexOf(recordsetCourseRegistration[j].period) === -1

                    })

                    if (resultPeriod) {
                        const tempArrayPeriod = [...arrayDifferent[i].period];
                        tempArrayPeriod.push(recordsetCourseRegistration[j].period);
                        arrayDifferent[i].period = tempArrayPeriod;

                    }


                    const resultIdSchedule = findKey(arrayDifferent, (item) => {
                        return item.idSchedule.indexOf(recordsetCourseRegistration[j].idSchedule) === -1

                    })

                    if (resultIdSchedule) {
                        const tempArrayIdSchedule = [...arrayDifferent[i].idSchedule];
                        tempArrayIdSchedule.push(recordsetCourseRegistration[j].idSchedule);
                        arrayDifferent[i].idSchedule = tempArrayIdSchedule;

                    }

                    const tempArrayIdStudent = [...arrayDifferent[i].students];
                    let have = false
                    for (let n = 0; n < arrayDifferent[i].students.length; n++) {
                        if (recordsetCourseRegistration[j].idStudent === tempArrayIdStudent[n].idStudent) {
                            have = true;
                        }
                    }
                    if (!have) {
                        tempArrayIdStudent.push({
                            idStudent: recordsetCourseRegistration[j].idStudent,
                            firstName: recordsetCourseRegistration[j].first_name_student,
                            lastName: recordsetCourseRegistration[j].last_name_student
                        });
                        arrayDifferent[i].students = tempArrayIdStudent;
                    }

                }
            }
        }

        for (let i = 0; i < arrayDifferent.length; i++) {
            arrayDifferent[i].day = uniq(arrayDifferent[i].day)
            arrayDifferent[i].idSchedule = uniq(arrayDifferent[i].idSchedule)
            arrayDifferent[i].startTime = uniq(arrayDifferent[i].startTime)
            // arrayDifferent[i].startTime.splice(0, 1)
            arrayDifferent[i].period = uniq(arrayDifferent[i].period)
            // arrayDifferent[i].students = uniq(arrayDifferent[i].students)
            // arrayDifferent[i].idSchedule.splice(0, 1)
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
            message: "Get course registration success",
            result: resultArray
        })
    } catch (e) {
        next(e);
    }
}

