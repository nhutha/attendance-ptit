import { id } from "date-fns/locale";
import { findKey, isEqual } from "lodash"

import connectDB from "../utils/connectDB";
import { DateUtil } from "../utils/date-utils";

export const createCreditClass = async (req, res, next) => {
    try {
        const connect = connectDB.connect;
        const { idSubject, idTeacher, idRoom, startDate, endDate, idSchedule } = req.body;

        if (!idSubject || !idTeacher || !idRoom || !startDate || !endDate || !idSchedule) {
            let error = new Error();
            error.message = "idSubject, idTeacher, idRoom, startDate, idSchedule and endDate is required";
            error.status = 400;
            throw error;
        }

        if (idSchedule.length > 0) {
            for (let i = 0; i < idSchedule.length; i++) {
                const queryCheckSchedule = `SELECT * FROM schedule where idSchedule = ${idSchedule[i]}`;

                const { recordset: recordsetSchedule } = await connect.query(queryCheckSchedule);

                if (recordsetSchedule.length <= 0) {
                    let error = new Error();
                    error.message = "idSchedule not found";
                    error.status = 404;
                    throw error;
                }


            }
        }

        const queryCheckSubject = `SELECT * FROM subject where idSubject = '${idSubject}' and isDelete = 0`;

        const { recordset: recordsetSubject } = await connect.query(queryCheckSubject);
        if (recordsetSubject.length <= 0) {
            let error = new Error();
            error.message = "idSubject not found";
            error.status = 404;
            throw error;
        }

        const queryCheckTeacher = `SELECT * FROM teacher where idTeacher = '${idTeacher}' and isDelete = 0`;

        const { recordset: recordsetTeacher } = await connect.query(queryCheckTeacher);
        if (recordsetTeacher.length <= 0) {
            let error = new Error();
            error.message = "idTeacher not found";
            error.status = 404;
            throw error;
        }

        const queryCheckRoom = `SELECT * FROM room where idRoom = ${idRoom} and isDelete = 0`;

        const { recordset: recordsetRoom } = await connect.query(queryCheckRoom);
        if (recordsetRoom.length <= 0) {
            let error = new Error();
            error.message = "idRoom not found";
            error.status = 404;
            throw error;
        }

        const currentDate = DateUtil.setHourMinute(new Date(DateUtil.addTimeWithOffsetAndTimezone(new Date(), 7)).getTime(), 0, 0, 0, 0);

        if (typeof +startDate !== 'number') {
            let error = new Error();
            error.message = `startDate must a number`;
            error.status = 400;
            throw error;
        }

        if (typeof +endDate !== 'number') {
            let error = new Error();
            error.message = `endDate must a number`;
            error.status = 400;
            throw error;
        }

        if (+startDate < currentDate) {
            let error = new Error();
            error.message = `startDate cannot be below currentDate (${currentDate})`;
            error.status = 400;
            throw error;
        }

        if (+startDate >= +endDate) {
            let error = new Error();
            error.message = "startDate cannot be greater than endDate";
            error.status = 400;
            throw error;
        }

        if (+endDate - +startDate <= 2505600) {
            let error = new Error();
            error.message = "The time between the endDate and the startDate are at least 30 days";
            error.status = 400;
            throw error;
        }

        for (let j = 0; j < idSchedule.length; j++) {
            const queryGetList = `SELECT * from credit_class cc JOIN credit_class_schedule ccs on ccs.idCreditClass = cc.idCreditClass where ccs.idSchedule = ${idSchedule[j]} and cc.isDelete = 0`;

            const { recordset: recordsetGetList } = await connect.query(queryGetList);

            if (recordsetGetList.length > 0) {
                for (let i = 0; i < recordsetGetList.length; i++) {
                    const { idRoom: idRoomList, startDate: startDateList, endDate: endDateList } = recordsetGetList[i];

                    if (idRoomList === idRoom) {
                        if ((+startDate <= +startDateList && +endDate <= +endDateList && +endDate >= +startDateList) || (+startDate >= +startDateList && +endDate <= +endDateList) || (+startDate >= +startDateList && +startDate <= +endDateList)) {
                            let error = new Error();
                            error.message = "Room is being used during this period";
                            error.status = 400;
                            throw error;
                        }
                    }
                }
            }
        }

        // check teacher same time

        const queryCheckTimeTeacher = `SELECT cc.startDate,cc.endDate,ccs.idSchedule FROM dbo.credit_class cc JOIN dbo.credit_class_schedule ccs ON ccs.idCreditClass = cc.idCreditClass where cc.idTeacher = '${idTeacher}' and cc.isDelete = 0`;

        const { recordset: recordsetCheckTimeTeacher } = await connect.query(queryCheckTimeTeacher)

        if (recordsetCheckTimeTeacher.length > 0) {
            for (let i = 0; i < recordsetCheckTimeTeacher.length; i++) {
                if ((+startDate <= +recordsetCheckTimeTeacher[i].startDate && +endDate <= +recordsetCheckTimeTeacher[i].endDate && +endDate >= +recordsetCheckTimeTeacher[i].endDate) || (+startDate >= +recordsetCheckTimeTeacher[i].startDate && +endDate <= +recordsetCheckTimeTeacher[i].endDate) || (+startDate >= +recordsetCheckTimeTeacher[i].startDate && +startDate <= +recordsetCheckTimeTeacher[i].endDate)) {
                    for (let j = 0; j < idSchedule.length; j++) {
                        if (idSchedule[j] === recordsetCheckTimeTeacher[i].idSchedule) {
                            let error = new Error();
                            error.message = "Teacher have a class in this time, please choose another time";
                            error.status = 400;
                            throw error;
                        }
                    }
                }
            }
        }


        // TODO: SP
        const queryCreate = `INSERT INTO credit_class(idSubject, idTeacher, idRoom, startDate, endDate) 
        values('${idSubject}', '${idTeacher}', ${idRoom}, ${startDate}, ${endDate})`;

        const { rowsAffected } = await connect.query(queryCreate);
        if (rowsAffected > 0) {
            const queryGetData = `SELECT * FROM credit_class where idSubject = '${idSubject}' and idTeacher = '${idTeacher}' and  idRoom = ${idRoom} and  startDate = ${startDate} and  endDate= ${endDate}`;
            const { recordset: recordsetGetData } = await connect.query(queryGetData);

            const newData = recordsetGetData[0];

            for (let i = 0; i < idSchedule.length; i++) {
                const queryCreateSchedule = `INSERT INTO credit_class_schedule(idCreditClass, idSchedule) values (${newData.idCreditClass}, ${idSchedule[i]})`;
                const { rowsAffected: rowsAffectedCreateSchedule } = await connect.query(queryCreateSchedule);
                if (rowsAffectedCreateSchedule <= 0) {
                    let error = new Error();
                    error.message = "create credit class fail";
                    error.status = 500;
                    throw error;
                }
            }

            res.status(200).send({
                message: "Create credit class success"
            })

        } else {
            let error = new Error();
            error.message = "create credit class fail";
            error.status = 400;
            throw error;
        }

    } catch (e) {
        next(e);
    }
}

export const updateCreditClass = async (req, res, next) => {
    try {
        const connect = connectDB.connect;

        const { idCreditClass } = req.params;

        let queryUpdateCreditClass = ',';
        const queryCheckCreditClass = `SELECT  cl.startDate, cl.endDate, sj.subjectName, r.roomName, r.idRoom,sj.idSubject,t.idTeacher,s.day,s.idSchedule, s.startTime,s.period, sj.numberOfCredits, t.bluetoothAddress, u.email, u.firstName, u.lastName, u.gender, u.dateOfBirth, u.image FROM credit_class cl JOIN credit_class_schedule ccs on cl.idCreditClass = ccs.idCreditClass JOIN schedule s on s.idSchedule = ccs.idSchedule JOIN subject sj on sj.idSubject = cl.idSubject JOIN teacher t on t.idTeacher = cl.idTeacher JOIN [user] u on u.idUser = t.idUser JOIN room r on r.idRoom = cl.idRoom where cl.idCreditClass = ${idCreditClass} and cl.isDelete = 0 and t.isDelete =0`

        const { recordset: recordsetCheckCreditClass } = await connect.query(queryCheckCreditClass);

        if (recordsetCheckCreditClass.length <= 0) {
            let error = new Error();
            error.message = "idCreditClass not found";
            error.status = 400;
            throw error;
        }

        const arrayDifferent = [{ ...recordsetCheckCreditClass[0] }];

        for (let i = 1; i < recordsetCheckCreditClass.length; i++) {
            let isHave = false;
            for (let j = 0; j < arrayDifferent.length; j++) {
                if (recordsetCheckCreditClass[i].idCreditClass === arrayDifferent[j].idCreditClass) {
                    isHave = true;
                }
            }
            if (!isHave) {
                const arrayTemp = { ...recordsetCheckCreditClass[i] }
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

            for (let j = 0; j < recordsetCheckCreditClass.length; j++) {
                if (arrayDifferent[i].idCreditClass === recordsetCheckCreditClass[j].idCreditClass) {
                    const resultDay = findKey(arrayDifferent, (item) => {

                        return item.day.indexOf(recordsetCheckCreditClass[j].day) === -1 || item.startTime.indexOf(recordsetCheckCreditClass[j].startTime) === -1

                    })
                    if (resultDay) {
                        const tempArrayDay = [...arrayDifferent[i].day];
                        tempArrayDay.push(recordsetCheckCreditClass[j].day);
                        arrayDifferent[i].day = tempArrayDay;

                        const tempArrayStartTime = [...arrayDifferent[i].startTime];
                        tempArrayStartTime.push(recordsetCheckCreditClass[j].startTime);
                        arrayDifferent[i].startTime = tempArrayStartTime;

                    }

                    const resultPeriod = findKey(arrayDifferent, (item) => {
                        return item.period.indexOf(recordsetCheckCreditClass[j].period) === -1

                    })

                    if (resultPeriod) {
                        const tempArrayPeriod = [...arrayDifferent[i].period];
                        tempArrayPeriod.push(recordsetCheckCreditClass[j].period);
                        arrayDifferent[i].period = tempArrayPeriod;

                    }


                    const resultIdSchedule = findKey(arrayDifferent, (item) => {
                        return item.idSchedule.indexOf(recordsetCheckCreditClass[j].idSchedule) === -1

                    })

                    if (resultIdSchedule) {
                        const tempArrayIdSchedule = [...arrayDifferent[i].idSchedule];
                        tempArrayIdSchedule.push(recordsetCheckCreditClass[j].idSchedule);
                        arrayDifferent[i].idSchedule = tempArrayIdSchedule;

                    }

                }
            }
        }
        for (let i = 0; i < arrayDifferent.length; i++) {
            arrayDifferent[i].day.splice(1, 1)
            arrayDifferent[i].startTime.splice(1, 1)
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
        let { idSubject, idTeacher, idRoom, startDate, endDate, idSchedule } = req.body;

        if (idSubject && resultArray[0].idSubject !== idSubject) {
            const queryCheckSubject = `SELECT * FROM subject where idSubject = '${idSubject}' and isDelete = 0`;

            const { recordset: recordsetSubject } = await connect.query(queryCheckSubject);
            if (recordsetSubject.length <= 0) {
                let error = new Error();
                error.message = "idSubject not found";
                error.status = 404;
                throw error;
            }

            queryUpdateCreditClass += `idSubject = '${idSubject}',`
        }

        const queryCheckDataRoom = `SELECT * from credit_class where idCreditClass = ${idCreditClass}`;

        const { recordset: recordsetCheckDataRoom } = await connect.query(queryCheckDataRoom)

        let currentIdRoom = "";
        if (recordsetCheckDataRoom.length > 0) {
            currentIdRoom = recordsetCheckDataRoom[0].idRoom
        }

        if (idRoom) {
            const queryCheckRoom = `SELECT * FROM room where idRoom = ${idRoom} and isDelete = 0`;

            const { recordset: recordsetRoom } = await connect.query(queryCheckRoom);
            if (recordsetRoom.length <= 0) {
                let error = new Error();
                error.message = "idRoom not found";
                error.status = 404;
                throw error;
            }

            for (let i = 0; i < resultArray.length; i++) {
                const { idRoom: idRoomList, startDate: startDateList, endDate: endDateList } = resultArray[i];

                if (idRoomList === idRoom && currentIdRoom !== idRoom) {
                    if ((+startDate <= +startDateList && +endDate <= +endDateList && +endDate >= +startDateList) || (+startDate >= +startDateList && +endDate <= +endDateList) || (+startDate >= +startDateList && +startDate <= +endDateList)) {
                        let error = new Error();
                        error.message = "Room is being used during this period";
                        error.status = 400;
                        throw error;
                    }
                }
            }

            queryUpdateCreditClass += `idRoom = ${idRoom},`;
        }

        const queryCheckTeacher = `SELECT * FROM teacher where idTeacher = '${idTeacher}' and isDelete = 0`;

        if (idTeacher && resultArray[0].idTeacher !== idTeacher) {
            const { recordset: recordsetTeacher } = await connect.query(queryCheckTeacher);
            if (recordsetTeacher.length <= 0) {
                let error = new Error();
                error.message = "idTeacher not found";
                error.status = 404;
                throw error;
            }

            queryUpdateCreditClass += `idTeacher = '${idTeacher}',`;
        }

        if (idSchedule) {
            if (typeof idSchedule !== 'object' && idSchedule.length <= 0) {
                let error = new Error();
                error.message = "idSchedule must a array";
                error.status = 400;
                throw error;
            }
        }

        if (startDate && resultArray[0].startDate !== startDate) {
            if (typeof +startDate !== 'number') {
                let error = new Error();
                error.message = `startDate must a number`;
                error.status = 400;
                throw error;
            }

            if (+startDate >= +resultArray[0].endDate) {
                let error = new Error();
                error.message = " startDate cannot be greater than current endDate";
                error.status = 400;
                throw error;
            }


        }

        if (endDate && resultArray[0].endDate !== endDate) {
            if (typeof +endDate !== 'number') {
                let error = new Error();
                error.message = `endDate must a number`;
                error.status = 400;
                throw error;
            }
            if (+endDate <= +resultArray[0].startDate) {
                let error = new Error();
                error.message = "endDate cannot be below current endDate";
                error.status = 400;
                throw error;
            }


        }

        if (startDate && !endDate) {
            if (+resultArray[0].endDate - +startDate <= 2505600) {
                let error = new Error();
                error.message = "The time between the current endDate and the startDate are at least 30 days";
                error.status = 400;
                throw error;
            }
        }

        if (endDate && !startDate) {
            if (+endDate - +resultArray[0].startDate <= 2505600) {
                let error = new Error();
                error.message = "The time between the endDate and the current startDate are at least 30 days";
                error.status = 400;
                throw error;
            }
        }

        if (startDate && endDate) {
            if (+startDate >= +endDate) {
                let error = new Error();
                error.message = "startDate cannot be greater than current endDate";
                error.status = 400;
                throw error;
            }

            if (+endDate - +startDate <= 2505600) {
                let error = new Error();
                error.message = "The time between the endDate and the startDate are at least 30 days";
                error.status = 400;
                throw error;
            }
        }

        if (startDate) {
            queryUpdateCreditClass += `startDate = ${startDate},`

        }

        if (endDate) {
            queryUpdateCreditClass += `endDate = ${endDate},`
        }

        // check teacher same time

        const queryCheckTimeTeacher = `SELECT cc.startDate,cc.endDate,ccs.idSchedule, cc.idCreditClass FROM dbo.credit_class cc JOIN dbo.credit_class_schedule ccs ON ccs.idCreditClass = cc.idCreditClass JOIN teacher t on t.idTeacher = cc.idTeacher where cc.idTeacher = '${idTeacher ? idTeacher : recordsetCheckCreditClass[0].idTeacher}' and cc.isDelete = 0 and t.isDelete = 0`;
        const { recordset: recordsetCheckTimeTeacher } = await connect.query(queryCheckTimeTeacher)
        if (+recordsetCheckTimeTeacher[0].idCreditClass !== +idCreditClass) {
            if (recordsetCheckTimeTeacher.length > 0 && idSchedule) {
                for (let i = 0; i < recordsetCheckTimeTeacher.length; i++) {
                    if ((+startDate ? +startDate : +recordsetCheckCreditClass[0].startDate <= +recordsetCheckTimeTeacher[i].startDate && +endDate ? +endDate : +recordsetCheckCreditClass[0].endDate <= +recordsetCheckTimeTeacher[i].endDate && +endDate ? +endDate : +recordsetCheckCreditClass[0].endDate >= +recordsetCheckTimeTeacher[i].endDate) || (+startDate ? +startDate : +recordsetCheckCreditClass[0].startDate >= +recordsetCheckTimeTeacher[i].startDate && +endDate ? +endDate : +recordsetCheckCreditClass[0].endDate <= +recordsetCheckTimeTeacher[i].endDate) || (+startDate ? +startDate : +recordsetCheckCreditClass[0].startDate >= +recordsetCheckTimeTeacher[i].startDate && +startDate ? +startDate : +recordsetCheckCreditClass[0].startDate <= +recordsetCheckTimeTeacher[i].endDate)) {
                        for (let j = 0; j < idSchedule.length; j++) {
                            if (idSchedule[j] === recordsetCheckTimeTeacher[i].idSchedule) {
                                let error = new Error();
                                error.message = "Teacher have a class in this time, please choose another time";
                                error.status = 400;
                                throw error;
                            }
                        }
                    }
                }
            }
        }

        queryUpdateCreditClass = queryUpdateCreditClass.substring(1, queryUpdateCreditClass.length - 1);
        if (queryUpdateCreditClass.length > 1) {
            const queryUpdate = `Update credit_class set ${queryUpdateCreditClass} where idCreditClass = ${idCreditClass}`;

            const { rowsAffected } = await connect.query(queryUpdate);

            if (rowsAffected > 0) {

                let queryCheckDataToUpdate = `SELECT * FROM credit_class_schedule where idCreditClass = ${idCreditClass}`;

                let { recordset: recordsetCheckDataToUpdate } = await connect.query(queryCheckDataToUpdate);

                if (idSchedule.length > 0 && recordsetCheckDataToUpdate.length > 0) {
                    for (let i = 0; i < idSchedule.length; i++) {
                        let isHave = false;
                        for (let j = 0; j < recordsetCheckDataToUpdate.length; j++) {
                            if (idSchedule[i] === recordsetCheckDataToUpdate[j].idSchedule) {
                                isHave = true;
                                recordsetCheckDataToUpdate.splice(j, 1);
                                break;
                            }
                        }
                        if (isHave) {
                            idSchedule.splice(i, 1);
                        }

                    }
                    for (let i = 0; i < recordsetCheckDataToUpdate.length; i++) {
                        const queryDeleteData = `Delete credit_class_schedule where idSchedule = ${recordsetCheckDataToUpdate[i].idSchedule} and idCreditClass = ${recordsetCheckDataToUpdate[i].idCreditClass}`
                        const { rowsAffected: rowsAffectedDeleteData } = await connect.query(queryDeleteData);
                        if (rowsAffectedDeleteData <= 0) {
                            let error = new Error();
                            error.message = "update credit class fail";
                            error.status = 500;
                            throw error;
                        }
                    }

                    for (let i = 0; i < idSchedule.length; i++) {
                        const queryUpdateCreditClassSchedule = `Insert into credit_class_schedule(idCreditClass, idSchedule) values(${idCreditClass}, ${idSchedule[i]})`
                        const { rowsAffected: rowsAffectedUpdateCreditClassSchedule } = await connect.query(queryUpdateCreditClassSchedule);
                        if (rowsAffectedUpdateCreditClassSchedule <= 0) {
                            let error = new Error();
                            error.message = "update credit class fail";
                            error.status = 500;
                            throw error;
                        }
                    }

                    res.status(200).send({
                        message: "Update credit class success"
                    })
                }

            } else {
                let error = new Error();
                error.message = "update credit class fail";
                error.status = 500;
                throw error;
            }
        } else {

            let queryCheckDataToUpdate = `SELECT * FROM credit_class_schedule where idCreditClass = ${idCreditClass}`;

            let { recordset: recordsetCheckDataToUpdate } = await connect.query(queryCheckDataToUpdate);

            if (idSchedule.length > 0 && recordsetCheckDataToUpdate.length > 0) {
                for (let i = 0; i < idSchedule.length; i++) {
                    let isHave = false;
                    for (let j = 0; j < recordsetCheckDataToUpdate.length; j++) {
                        if (idSchedule[i] === recordsetCheckDataToUpdate[j].idSchedule) {
                            isHave = true;
                            recordsetCheckDataToUpdate.splice(j, 1);
                            break;
                        }
                    }
                    if (isHave) {
                        idSchedule.splice(i, 1);
                    }

                }
                for (let i = 0; i < recordsetCheckDataToUpdate.length; i++) {
                    const queryDeleteData = `Delete credit_class_schedule where idSchedule = ${recordsetCheckDataToUpdate[i].idSchedule} and idCreditClass = ${recordsetCheckDataToUpdate[i].idCreditClass}`
                    const { rowsAffected: rowsAffectedDeleteData } = await connect.query(queryDeleteData);
                    if (rowsAffectedDeleteData <= 0) {
                        let error = new Error();
                        error.message = "update credit class fail";
                        error.status = 500;
                        throw error;
                    }
                }

                for (let i = 0; i < idSchedule.length; i++) {
                    const queryUpdateCreditClassSchedule = `Insert into credit_class_schedule(idCreditClass, idSchedule) values(${idCreditClass}, ${idSchedule[i]})`
                    const { rowsAffected: rowsAffectedUpdateCreditClassSchedule } = await connect.query(queryUpdateCreditClassSchedule);
                    if (rowsAffectedUpdateCreditClassSchedule <= 0) {
                        let error = new Error();
                        error.message = "update credit class fail";
                        error.status = 500;
                        throw error;
                    }
                }

                res.status(200).send({
                    message: "Update credit class success"
                })
            } else {
                res.status(200).send({
                    message: "No data new to update"
                })
            }

        }

    } catch (e) {
        next(e);
    }
}

export const deleteCreditClass = async (req, res, next) => {
    try {
        const connect = connectDB.connect;
        const { idCreditClass } = req.params;

        const queryCheck = `SELECT * FROM credit_class where idCreditClass = ${idCreditClass} and isDelete = 0`

        const { recordset } = await connect.query(queryCheck);
        if (recordset.length > 0) {
            const queryDelete = `UPDATE credit_class set isDelete = 1 where idCreditClass = ${idCreditClass}`
            const { rowsAffected } = await connect.query(queryDelete);
            if (rowsAffected > 0) {
                const queryDeleteCourseRegistration = `UPDATE course_registration set isDelete = 1 where idCreditClass = ${idCreditClass}`

                const { rowsAffected: rowsAffectedDelete } = await connect.query(queryDeleteCourseRegistration);
                if (rowsAffectedDelete > 0) {
                    res.status(200).send({
                        message: "delete credit class success"
                    })
                } else {
                    let error = new Error();
                    error.message = "delete credit class fail";
                    error.status = 500;
                    throw error;
                }

            } else {
                let error = new Error();
                error.message = "delete credit class fail";
                error.status = 500;
                throw error;
            }
        } else {
            let error = new Error();
            error.message = "credit class not found";
            error.status = 404;
            throw error;
        }
    } catch (e) {
        next(e);
    }
}

export const getCreditClass = async (req, res, next) => {
    try {
        const connect = connectDB.connect;
        const { idCreditClass } = req.params;
        const query = `SELECT  cl.startDate, cl.endDate, sj.subjectName, r.roomName, r.idRoom,sj.idSubject,t.idTeacher,s.day,s.idSchedule, s.startTime,s.period, sj.numberOfCredits, t.bluetoothAddress, u.email, u.firstName, u.lastName, u.gender, u.dateOfBirth, u.image FROM credit_class cl JOIN credit_class_schedule ccs on cl.idCreditClass = ccs.idCreditClass JOIN schedule s on s.idSchedule = ccs.idSchedule JOIN subject sj on sj.idSubject = cl.idSubject JOIN teacher t on t.idTeacher = cl.idTeacher JOIN [user] u on u.idUser = t.idUser JOIN room r on r.idRoom = cl.idRoom where cl.idCreditClass = ${idCreditClass} and cl.isDelete = 0`
        const { recordset } = await connect.query(query);

        if (recordset.length > 1) {
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
            // for (let i = 0; i < arrayDifferent.length; i++) {
            //     arrayDifferent[i].day.splice(1, 1)
            //     arrayDifferent[i].startTime.splice(1, 1)
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
                message: "Get credit class success",
                result: resultArray
            })
        } else if (recordset.length === 1) {


            switch (recordset[0].day) {
                case 1: recordset[0].day = 'Sunday'; break;
                case 2: recordset[0].day = 'Monday'; break;
                case 3: recordset[0].day = 'Tuesday'; break;
                case 4: recordset[0].day = 'Wednesday'; break;
                case 5: recordset[0].day = 'Thursday'; break;
                case 6: recordset[0].day = 'Friday'; break;
                case 7: recordset[0].day = 'Saturday'; break;
            }



            if (recordset[0].startTime >= 12) {
                recordset[0].startTime = {
                    session: "afternoon",
                    time: recordset[0].startTime
                }
            } else {
                recordset[0].startTime = {
                    session: "morning",
                    time: recordset[0].startTime
                }
            }


            res.status(200).send({
                message: "Get credit class success",
                result: recordset[0]
            })
        }

        else {
            let error = new Error();
            error.message = "credit class not found";
            error.status = 404;
            throw error;
        }
    } catch (e) {
        next(e);
    }
}

export const getListCreditClass = async (req, res, next) => {
    try {
        const query = `SELECT cl.idCreditClass, cl.startDate, cl.endDate, sj.subjectName, r.roomName,r.idRoom,sj.idSubject,t.idTeacher, s.day, s.startTime,s.period,s.idSchedule, sj.numberOfCredits, t.bluetoothAddress, u.email, u.firstName, u.lastName, u.gender, u.dateOfBirth, u.image FROM credit_class cl JOIN credit_class_schedule ccs on cl.idCreditClass = ccs.idCreditClass JOIN schedule s on s.idSchedule = ccs.idSchedule JOIN subject sj on sj.idSubject = cl.idSubject JOIN teacher t on t.idTeacher = cl.idTeacher JOIN [user] u on u.idUser = t.idUser JOIN room r on r.idRoom = cl.idRoom where cl.isDelete = 0 `
        const connect = connectDB.connect;

        const { recordset } = await connect.query(query);

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
                message: "Get list credit class success",
                result: resultArray
            })
        } else {
            let error = new Error();
            error.message = "credit class not found";
            error.status = 404;
            throw error;
        }
    } catch (e) {
        next(e);
    }
}
