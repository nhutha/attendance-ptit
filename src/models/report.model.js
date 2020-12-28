import { DateUtil } from "../utils/date-utils"
import connectDB from "../utils/connectDB";
import { exportExcel, importExcel } from "../utils/export-excel";
import { differenceInCalendarWeeks } from "date-fns";
import { findKey, clone, filter, uniqBy } from "lodash"
import { isGeneratorFunction } from "regenerator-runtime";

export const getListStudentAttendance = async (req, res, next) => {
    try {
        const connect = connectDB.connect;
        const { idCreditClass } = req.params;

        const queryCheckCreditClass = `SELECT * FROM credit_class where idCreditClass = ${idCreditClass}`;

        const { recordset: recordsetCheckCreditClass } = await connect.query(queryCheckCreditClass);

        if (recordsetCheckCreditClass.length <= 0) {
            let error = new Error();
            error.message = "Credit class not found";
            error.status = 404;
            throw error;
        }

        const queryGetSum = `SELECT s.numberOfCredits,s.subjectName, u.firstName,u.lastName FROM dbo.credit_class cc
         JOIN dbo.subject s ON s.idSubject = cc.idSubject JOIN dbo.teacher t ON
          t.idTeacher = cc.idTeacher JOIN dbo.[user] u ON u.idUser = t.idUser WHERE
           cc.idCreditClass = ${idCreditClass}`

        const { recordset: recordsetSum } = await connect.query(queryGetSum)

        if (recordsetSum.length <= 0) {
            let error = new Error();
            error.message = "Get number of credit fail";
            error.status = 404;
            throw error;
        }

        const query = `SELECT  0 AS attendance,cr.idStudent,u.firstName,u.lastName FROM
        dbo.credit_class cc JOIN dbo.course_registration cr ON cr.idCreditClass =
        cc.idCreditClass JOIN dbo.student st ON st.idStudent = cr.idStudent 
        JOIN dbo.[user] u ON u.idUser = st.idUser   WHERE cc.idCreditClass = 
        ${idCreditClass} AND cr.idStudent NOT IN ( SELECT  a.idStudent FROM 
        dbo.credit_class cc JOIN dbo.attendance a ON a.idCreditClass = 
        cc.idCreditClass WHERE a.idCreditClass = ${idCreditClass})
        UNION
        SELECT COUNT(a.idStudent) AS attendance, a.idStudent,
        u.firstName,u.lastName FROM dbo.credit_class cc JOIN dbo.attendance
        a ON a.idCreditClass = cc.idCreditClass JOIN dbo.student st ON 
        st.idStudent = a.idStudent JOIN dbo.[user] u ON u.idUser = st.idUser 
        WHERE a.idCreditClass = ${idCreditClass}
        GROUP BY a.idStudent,u.firstName,u.lastName`;
        const { recordset } = await connect.query(query);
        if (recordset.length > 0) {
            const lastNameTemp = recordsetSum[0].lastName.split(' ');
            const firstNameTemp = recordsetSum[0].firstName.split(' ');
            let lastName = "";
            let firstName = "";
            for (let i = 0; i < lastNameTemp.length; i++) {
                if (lastNameTemp[i].trim().length > 0) {
                    lastName += lastNameTemp[i] + "_";
                }

            }

            for (let i = 0; i < firstNameTemp.length; i++) {
                if (firstNameTemp[i].trim().length > 0) {
                    firstName += firstNameTemp[i] + "_";
                }

            }

            const resultLastName = lastName.substr(0, lastName.length - 1)
            const resultFirstName = firstName.substr(0, firstName.length - 1)

            const link = await exportExcel(recordset, +recordsetSum[0].numberOfCredits * 3, recordsetSum[0].subjectName + '_' + resultLastName + '_' + resultFirstName)
            res.status(200).send({
                message: "Get attendance success",
                result: {
                    listStudent: recordset,
                    numberOfCredits: +recordsetSum[0].numberOfCredits * 3,
                    excel: link
                }
            })


        } else {
            let error = new Error();
            error.message = "Attendance list not found";
            error.status = 404;
            throw error;
        }
    } catch (e) {
        next(e);
    }
}

export const getNumberOfStudent = async (req, res, next) => {
    try {
        const connect = connectDB.connect;
        const query = `SELECT COUNT(*) AS number_student FROM dbo.student`

        const { recordset } = await connect.query(query);

        if (recordset.length > 0) {
            res.status(200).send({
                message: "Get number student success",
                result: recordset[0]
            })
        } else {
            let error = new Error();
            error.message = "Get number student fail";
            error.status = 500;
            throw error;
        }

    } catch (e) {
        next(e);
    }
}

export const getListStudentOutOfSchool = async (req, res, next) => {
    try {
        const connect = connectDB.connect;

        const query = ` SELECT (select COUNT(ccs2.idCreditClass) from credit_class_schedule ccs2 where ccs2.idCreditClass = cc.idCreditClass
                        group by ccs2.idCreditClass) as schedule , u.firstName,u.lastName,cc.idSubject,sb.subjectName,sb.numberOfCredits,cc.idCreditClass,
                        cc.startDate, cc.endDate, s.day, s.startTime,cc.idCreditClass,st.idStudent
                        FROM dbo.credit_class cc JOIN dbo.subject sb ON sb.idSubject = cc.idSubject JOIN dbo.course_registration cr ON cr.idCreditClass = 
                        cc.idCreditClass JOIN dbo.student st ON st.idStudent = cr.idStudent JOIN credit_class_schedule ccs on ccs.idCreditClass = 
                        cc.idCreditClass JOIN schedule s ON s.idSchedule = ccs.idSchedule JOIN dbo.[user] u ON u.idUser = st.idUser where st.isDelete = 0 
                        and cc.isDelete = 0                      
                        `;
        const currentDate = new Date(DateUtil.addTimeWithOffsetAndTimezone(new Date(), 7));
        const { recordset } = await connect.query(query);
        if (recordset.length > 0) {
            const arrayHaveListSchedule = [];
            for (let i = 0; i < recordset.length; i++) {
                const arrayData = filter(recordset, (item) => {
                    return item.idStudent === recordset[i].idStudent
                })
                let numberDayLearn = 0;
                for (let j = 0; j < arrayData.length; j++) {
                    const startWeek = DateUtil.startOfWeek(+arrayData[j].startDate);
                    const currentWeek = DateUtil.endOfWeek(currentDate.getTime());
                    const week = differenceInCalendarWeeks(currentWeek, startWeek);
                    numberDayLearn += week;
                    if (currentDate.getDay() + 1 < +arrayData[j].day) {
                        numberDayLearn -= 1;
                    }
                    if (currentDate.getDay() + 1 === +arrayData[j].day && currentDate.getHours() + 7 <= +arrayData[j].startTime) {
                        numberDayLearn -= 1;
                    }
                }

                arrayHaveListSchedule.push({
                    idStudent: recordset[i].idStudent,
                    firstName: recordset[i].firstName,
                    lastName: recordset[i].lastName,
                    numberDayLearn
                })
            }
            const arrayUniq = uniqBy(arrayHaveListSchedule, 'idStudent')

            const queryGetList = `SELECT count(a.idStudent) as attendance, a.idStudent
                                    FROM attendance a 
                                    GROUP BY  a.idStudent `

            const { recordset: recordsetGetList } = await connect.query(queryGetList);
            if (recordsetGetList.length > 0) {
                for (let i = 0; i < arrayUniq.length; i++) {
                    let sum = 0;
                    for (let k = 0; k < recordsetGetList.length; k++) {
                        if (arrayUniq[i].idStudent === recordsetGetList[k].idStudent) {

                            sum += recordsetGetList[k].attendance;

                        }
                    }
                    arrayUniq[i].outOfSchool = +arrayUniq[i].numberDayLearn - sum

                }
            }

            arrayUniq.sort((a, b) => {
                if (a.outOfSchool > b.outOfSchool) {
                    return 1;
                } else if (a.outOfSchool >= b.outOfSchool) {
                    return -1;
                } else {
                    return 0;
                }
            });



            if (arrayUniq.length > 5) {
                arrayUniq.length = 5;
            }


            res.status(200).send({
                message: "Get list student out of school success",
                result: arrayUniq
            })
        } else {
            let error = new Error();
            error.message = "Get list student out of school fail";
            error.status = 500;
            throw error;
        }
    } catch (e) {
        next(e)
    }
}

export const getListStudentOutOfSchoolByWeek = async (req, res, next) => {
    try {

        const currentDay = new Date(DateUtil.addTimeWithOffsetAndTimezone(new Date(), 7));
        const connect = connectDB.connect;

        let startOfWeek = DateUtil.startOfWeek(currentDay).getTime() / 1000;

        const queryGetListAttendance = `SELECT * FROM attendance`;

        const { recordset: recordsetGetList } = await connect.query(queryGetListAttendance)

        if (recordsetGetList.length <= 0) {
            let error = new Error();
            error.message = "No student attendance";
            error.status = 404;
            throw error;
        }

        const resultArray = [];



        for (let i = 0; i < 7; i++) {

            const query = `SELECT s.day, cc.idCreditClass, cc.startDate,cc.endDate, cr.idStudent FROM 
            dbo.credit_class_schedule ccs JOIN dbo.schedule s ON s.idSchedule = 
            ccs.idSchedule JOIN dbo.credit_class cc 
            ON cc.idCreditClass = ccs.idCreditClass JOIN dbo.course_registration cr ON 
            cr.idCreditClass = cc.idCreditClass WHERE cc.startDate <= ${startOfWeek * 1000}  
            AND cc.endDate >= ${startOfWeek * 1000} and day = ${i + 1}`;

            const { recordset } = await connect.query(query);

            const listFilter = recordsetGetList.filter((item) => {
                return Math.round(+item.dateAttendance / 1000) < startOfWeek + 86400 && Math.round(+item.dateAttendance / 1000) > startOfWeek
            })
            const arrayTemp = [];

            for (let k = 0; k < recordset.length; k++) {
                let isHave = false;
                for (let h = 0; h < listFilter.length; h++) {

                    if (recordset[k].idStudent === listFilter[h].idStudent && recordset[k].idCreditClass === listFilter[h].idCreditClass) {
                        isHave = true;
                    }
                }
                if (!isHave) {
                    arrayTemp.push(recordset[k])
                }
            }

            resultArray.push(arrayTemp)


            startOfWeek += 86400;

        }

        res.status(200).send({
            message: "Get list out of school by week success",
            result: resultArray
        })


    } catch (e) {
        next(e);
    }
}

export const importDataFromExcel = async (req, res, next) => {
    try {
        const { file } = req;

        await importExcel(file)
        res.status(200).send({
            message: "Import data finish"
        })

    } catch (e) {
        next(e);
    }
}