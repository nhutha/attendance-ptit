import execljs from "exceljs";
import bcrypt from "bcrypt";
import appRoot from "app-root-path";

import connectDB from "../utils/connectDB";
import { DateUtil } from "../utils/date-utils";

export const exportExcel = async (data, numberOfCredits, name) => {
    const currentDate = new Date(DateUtil.addTimeWithOffsetAndTimezone(new Date(), 7));
    const workBook = new execljs.Workbook();

    const workSheet = workBook.addWorksheet(`${currentDate.getDate()}-${currentDate.getMonth() + 1}-${currentDate.getFullYear()}`);

    workSheet.columns = [
        { header: 'IdStudent', key: 'idStudent', width: 10 },
        { header: 'Name', key: 'Name', width: 32 },
        { header: 'Attendance.', key: 'Attendance', width: 15, }
    ];
    for (let i = 0; i < data.length; i++) {
        workSheet.addRow({ idStudent: data[i].idStudent, Name: data[i].lastName + ' ' + data[i].firstName, Attendance: data[i].attendance + '/' + numberOfCredits });
    }

    await workBook.xlsx.writeFile(appRoot.path + '/public/reports/' + `${name.trim()}-${currentDate.getDate()}-${currentDate.getMonth() + 1}-${currentDate.getFullYear()}.xlsx`);
    return '/public/reports/' + `${name.trim()}-${currentDate.getDate()}-${currentDate.getMonth() + 1}-${currentDate.getFullYear()}.xlsx`;
}

export const importExcel = async (file) => {

    const workBook = new execljs.Workbook();
    const fileExcel = await workBook.xlsx.readFile(`${appRoot.path}/public/data/${file.originalname}`)

    const importDataAlone = () => {
        importRole(fileExcel);

        importRoom(fileExcel);

        importSubject(fileExcel);

        importSchedule(fileExcel);

        importClass(fileExcel);
    }
    await importDataAlone()

    await importTeacher(fileExcel);

    await importStudent(fileExcel);

    await importCreditClass(fileExcel);

    await importCourseRegistration(fileExcel);
}

const importCourseRegistration = (fileExcel) => {
    const connect = connectDB.connect;
    const sheetCourseRegistration = fileExcel.getWorksheet('course_registration');
    let timeDelay = 50;
    sheetCourseRegistration.eachRow({ includeEmpty: false }, async (row, rowNumber) => {
        if (rowNumber > 1) {
            setTimeout(async () => {
                const emailStudent = row.values[1];
                const subjectName = row.values[2];
                const emailTeacher = row.values[3];
                const roomName = row.values[4];
                const startDate = row.values[5];
                const endDate = row.values[6];

                if (emailStudent) {
                    const queryCheckSubject = `SELECT * FROM subject where subjectName = N'${subjectName}'`;
                    const { recordset: recordsetSubject } = await connect.query(queryCheckSubject)
                    if (recordsetSubject.length > 0) {
                        const idSubject = recordsetSubject[0].idSubject;

                        const queryCheckTeacher = `SELECT t.idTeacher FROM [user] u JOIN teacher t on t.idUser = u.idUser where u.email = '${emailTeacher}'`;
                        const { recordset: recordsetTeacher } = await connect.query(queryCheckTeacher)
                        if (recordsetTeacher.length > 0) {
                            const idTeacher = recordsetTeacher[0].idTeacher;

                            const queryCheckRoom = `SELECT * FROM room where roomName = '${roomName}'`;
                            const { recordset: recordsetRoom } = await connect.query(queryCheckRoom)
                            if (recordsetRoom.length > 0) {
                                const idRoom = recordsetRoom[0].idRoom;

                                const queryCheckStudent = `SELECT t.idStudent FROM [user] u JOIN student t on t.idUser = u.idUser where u.email = '${emailStudent}'`;
                                const { recordset: recordsetStudent } = await connect.query(queryCheckStudent);
                                if (recordsetStudent.length > 0) {
                                    const idStudent = recordsetStudent[0].idStudent;

                                    const queryCheckCreditClass = `SELECT * FROM credit_class where idSubject = '${idSubject}' and idTeacher = '${idTeacher}' and idRoom  = ${idRoom} and startDate = ${startDate} and endDate = ${endDate}`
                                    const { recordset: recordsetCreditClass } = await connect.query(queryCheckCreditClass);
                                    if (recordsetCreditClass.length > 0) {
                                        const idCreditClass = recordsetCreditClass[0].idCreditClass
                                        const queryCreate = `INSERT INTO course_registration(idStudent, idCreditClass) values ('${idStudent}', ${idCreditClass})`;

                                        const { rowsAffected } = await connect.query(queryCreate);
                                        if (rowsAffected <= 0) {
                                            console.log("Create course registration fail " + rowNumber);
                                        } else {
                                            console.log("Create course registration success")
                                        }
                                    }
                                }
                            }
                        }
                    }

                }
            }, timeDelay);
            timeDelay += 50;
        }

    })

    console.log("Import course registration success")

}

const importCreditClass = (fileExcel) => {
    const connect = connectDB.connect;
    const sheetCreditClass = fileExcel.getWorksheet('credit_class');
    let timeDelay = 50;
    sheetCreditClass.eachRow({ includeEmpty: false }, async (row, rowNumber) => {
        if (rowNumber > 1) {

            const subjectName = row.values[1];
            const emailTeacher = row.values[2];
            const roomName = row.values[3];
            const startDate = row.values[4];
            const endDate = row.values[5];
            const day = row.values[6];
            const time = row.values[7];
            const period = row.values[8];
            if (subjectName) {

                const queryCheckSubject = `SELECT * FROM subject where subjectName = N'${subjectName}'`;

                const { recordset: recordsetSubject } = await connect.query(queryCheckSubject)
                if (recordsetSubject.length > 0) {
                    const idSubject = recordsetSubject[0].idSubject;

                    const queryCheckTeacher = `SELECT t.idTeacher FROM [user] u JOIN teacher t on t.idUser = u.idUser where email = '${emailTeacher}'`;
                    const { recordset: recordsetTeacher } = await connect.query(queryCheckTeacher)

                    if (recordsetTeacher.length > 0) {
                        const idTeacher = recordsetTeacher[0].idTeacher;

                        const queryCheckRoom = `SELECT * FROM room where roomName = '${roomName}'`;

                        const { recordset: recordsetRoom } = await connect.query(queryCheckRoom)

                        if (recordsetRoom.length > 0) {
                            const idRoom = recordsetRoom[0].idRoom;

                            const queryCheckSchedule = `SELECT * FROM schedule where day= ${day} and startTime = ${time} and period = ${period}`;
                            const { recordset: recordsetSchedule } = await connect.query(queryCheckSchedule);
                            if (recordsetSchedule.length > 0) {
                                const idSchedule = recordsetSchedule[0].idSchedule;

                                const queryCreate = `INSERT INTO credit_class(idSubject, idTeacher, idRoom, startDate, endDate) 
                                                     values('${idSubject}', '${idTeacher}', ${idRoom}, ${startDate}, ${endDate})`;

                                const { rowsAffected } = await connect.query(queryCreate);
                                if (rowsAffected > 0) {
                                    const queryGetData = `SELECT * FROM credit_class where idSubject = '${idSubject}' and idTeacher = '${idTeacher}' and  idRoom = ${idRoom} and  startDate = ${startDate} and  endDate= ${endDate}`;
                                    const { recordset: recordsetGetData } = await connect.query(queryGetData);

                                    const newData = recordsetGetData[0];

                                    const queryCreateSchedule = `INSERT INTO credit_class_schedule(idCreditClass, idSchedule) values (${newData.idCreditClass}, ${idSchedule})`;
                                    const { rowsAffected: rowsAffectedCreateSchedule } = await connect.query(queryCreateSchedule);
                                    if (rowsAffectedCreateSchedule <= 0) {
                                        console.log("Create credit class fail " + rowNumber)
                                    } else {
                                        console.log("Create credit class success")
                                    }

                                } else {
                                    console.log("Create credit class fail " + rowNumber)
                                }

                            }
                        }
                    }
                }
            }

            timeDelay += 50;
        }

    })

    console.log("Import credit class finish")
}

const importStudent = (fileExcel) => {

    const connect = connectDB.connect;
    const sheetStudent = fileExcel.getWorksheet('student');
    let timeDelay = 50;
    sheetStudent.eachRow({ includeEmpty: false }, async (row, rowNumber) => {
        if (rowNumber > 1) {
            setTimeout(async () => {
                const email = row.values[1];
                console.log("email ", email)
                const firstName = row.values[2];
                const lastName = row.values[3];
                const gender = row.values[4];
                const dateOfBirth = row.values[5];
                const className = row.values[6];
                if (email) {

                    const queryCheck = `SELECT * FROM [user] where email = '${email}'`;

                    const { recordset } = await connect.query(queryCheck);
                    if (recordset.length <= 0) {
                        const queryGetClass = `SELECT * FROM class where className = '${className}'`

                        const { recordset: recordsetClass } = await connect.query(queryGetClass)

                        if (recordsetClass.length > 0) {
                            const codeChangePasswordHash = await bcrypt.hash(process.env.CODE_CHANGE_PASSWORD, +process.env.saltRound);

                            const query = `EXEC dbo.sp_createStudent @email = '${email}', @firstName = N'${firstName}', @lastName = N'${lastName}', @gender='${gender}', @dateOfBirth =${dateOfBirth}, @idClass ='${recordsetClass[0].idClass}', @image ='', @code = '${codeChangePasswordHash}' `;


                            const { rowsAffected: rowsAffectedCreate } = await connect.query(query);
                            if (rowsAffectedCreate.length > 0) {
                                console.log("Create student success " + email)

                            } else {
                                console.log("Create student fail " + email)
                            }
                        } else {
                            console.log("Create student fail because className " + className + " not found")
                        }

                    }
                }
            }, timeDelay);
            timeDelay += 50
        }

    })
    console.log("Import student finish")

}

const importTeacher = (fileExcel) => {
    const connect = connectDB.connect;
    const sheetTeacher = fileExcel.getWorksheet('teacher');
    let timeDelay = 50;
    sheetTeacher.eachRow({ includeEmpty: false }, async (row, rowNumber) => {
        if (rowNumber > 1) {
            setTimeout(async () => {
                const email = row.values[1];
                const firstName = row.values[2];
                const lastName = row.values[3];
                const gender = row.values[4];
                const dateOfBirth = row.values[5];
                const bluetoothAddress = row.values[6];
                if (email) {
                    const queryCheck = `SELECT * FROM [user] where email = '${email}'`;

                    const { recordset } = await connect.query(queryCheck);

                    if (recordset.length <= 0) {
                        const codeChangePasswordHash = await bcrypt.hash(process.env.CODE_CHANGE_PASSWORD, +process.env.saltRound);

                        const query = `EXEC dbo.sp_createTeacher @email = '${email}', @firstName = N'${firstName}', @lastName = N'${lastName}', @gender='${gender}', @dateOfBirth =${dateOfBirth}, @bluetoothAddress ='${bluetoothAddress ? bluetoothAddress : ''}', @image ='', @code = '${codeChangePasswordHash}' `;

                        const { rowsAffected: rowsAffectedCreate } = await connect.query(query);
                        if (rowsAffectedCreate.length > 0) {
                            console.log("Create teacher success " + email)

                        } else {
                            console.log("Create teacher fail " + email)
                        }
                    }

                }
            }, timeDelay);
            timeDelay += 50;
        }

    })
    console.log("Import teacher finish")
}

const importSchedule = (fileExcel) => {
    const connect = connectDB.connect;
    const sheetSchedule = fileExcel.getWorksheet('schedule');

    sheetSchedule.eachRow({ includeEmpty: false }, async (row, rowNumber) => {
        if (rowNumber > 1) {
            const day = row.values[1];
            const startTime = row.values[2];
            const period = row.values[3];
            if (day) {
                const checkSchedule = `SELECT * FROM schedule where day = ${day} and startTime = ${startTime} and period = ${period}`;

                const { recordset } = await connect.query(checkSchedule);

                if (recordset.length <= 0) {
                    const query = `INSERT INTO schedule(day, startTime, period) values(${day}, ${startTime}, ${period})`;
                    const { rowsAffected } = await connect.query(query);
                    if (rowsAffected > 0) {
                        console.log(`Create schedule success`)
                    } else {
                        console.log(`Create schedule day = ${day}, startTime = ${startTime}, period = ${period} fail`)
                    }
                }

            }
        }

    })
    console.log("Import schedule success")
}

const importClass = (fileExcel) => {
    const connect = connectDB.connect;
    const sheetClass = fileExcel.getWorksheet('class');
    let timeDelay = 50;
    sheetClass.eachRow({ includeEmpty: false }, async (row, rowNumber) => {
        if (rowNumber > 1) {
            setTimeout(async () => {
                const className = row.values[1];
                if (className) {

                    const checkClassName = `SELECT * FROM class where className = '${className}'`;

                    const { recordset } = await connect.query(checkClassName);

                    if (recordset.length <= 0) {
                        const query = `EXEC dbo.sp_createClass N'${className}'`;
                        const { rowsAffected: rowsAffectedCreate } = await connect.query(query);
                        if (rowsAffectedCreate.length > 0) {
                            console.log(`Create class ${className} success`)
                        } else {
                            console.log(`Create class ${className} fail`)
                        }
                    }
                }
            }, timeDelay);
            timeDelay += 50;
        }

    })

    console.log("Import class success")
}

const importRoom = (fileExcel) => {
    const connect = connectDB.connect;
    const sheetRoom = fileExcel.getWorksheet('room');

    sheetRoom.eachRow({ includeEmpty: false }, async (row, rowNumber) => {
        if (rowNumber > 1) {
            const roomName = row.values[1];
            if (roomName) {

                const checkRoomName = `SELECT * FROM room where roomName = '${roomName}'`;

                const { recordset } = await connect.query(checkRoomName);

                if (recordset.length <= 0) {
                    const queryInsert = `INSERT INTO room(roomName) values('${roomName}')`;
                    const { rowsAffected } = await connect.query(queryInsert);
                    if (rowsAffected < 0) {
                        console.log("Insert fail " + roomName)
                    } else {
                        console.log("Insert success " + roomName)
                    }
                }
            }
        }

    })
    console.log("Import room success")
}

const importSubject = async (fileExcel) => {

    const connect = connectDB.connect;
    const sheetSubject = fileExcel.getWorksheet('subject');
    let timeDelay = 50;
    await sheetSubject.eachRow({ includeEmpty: false }, async (row, rowNumber) => {
        if (rowNumber > 1) {
            setTimeout(async () => {
                const subjectName = row.values[1];
                const numberOfCredits = row.values[2];

                if (subjectName) {

                    const checkSubjectName = `SELECT * FROM subject where subjectName = N'${subjectName}'`;

                    const { recordset } = await connect.query(checkSubjectName);
                    if (recordset.length <= 0) {
                        const query = `EXEC dbo.sp_createSubject N'${subjectName}', ${numberOfCredits}`;

                        const { rowsAffected: rowsAffectedCreate } = await connect.query(query);

                        if (rowsAffectedCreate.length > 0) {
                            console.log("Create subject success " + subjectName)
                        } else {
                            console.log("Create subject fail " + subjectName)
                        }

                    }
                }
            }, timeDelay);
            timeDelay += 50
        }
    })
    console.log("Import subject finish")
}

const importRole = (fileExcel) => {
    const sheetRole = fileExcel.getWorksheet('role');
    const connect = connectDB.connect;

    sheetRole.eachRow({ includeEmpty: false }, async (row, rowNumber) => {
        if (rowNumber > 1) {
            const roleName = row.values[1];
            if (roleName) {

                const queryCheckRoleName = `SELECT * FROM role where roleName = '${roleName}'`;

                const { recordset } = await connect.query(queryCheckRoleName);
                if (recordset.length <= 0) {
                    const queryInsert = `Insert into role(roleName) values('${roleName}')`;
                    const { rowsAffected } = await connect.query(queryInsert)
                    if (rowsAffected < 0) {
                        console.log("Insert fail " + roleName)
                    } else {
                        console.log("Insert success " + roleName)
                    }
                }
            }
        }
    })
    console.log("Import role finish")
}