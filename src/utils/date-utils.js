import * as dateFns from 'date-fns';

export const DateFormatType = {
    TinyDateAndHours: 'YYMMDDHH00',
    TinyDateAndHoursAndMinute: 'YYMMDDHHmm',
    TinyDate: 'd',
    TinyHours: 'h',
    TinyMinute: 'mm',
    TinyMonth: 'MMMM',
    TinyHoursAndMinute: 'HHmm',
    TinyHoursAndMonth: 'HH00 MMM DD',
    HoursAndMinute: 'HH:mm',
    HoursAndMinuteAndSecond: 'HH:mm:ss',
    DayOfWeek: 'eee',
    DateNoTime: 'dd/MM/yyyy',
    DateNoZone: 'YYYY-MM-DD[T]HH:mm:ss',
    DateTimeZone: 'YYYY-MM-DD[T]HH:mm:ss.SSSZ',
    DateZeroTimeInUTC: 'YYYY-MM-DD[T]00:00:SSSZ',
    DatabaseTime: 'YYYY-MM-DD HH:mm:ss',
    DatabaseTimeNoMinute: 'YYYY-MM-DD HH:00:00',
    DatabaseTimeNoSeconds: 'HH:mm dd/MM/yyyy',
    TinyHoursMinuteAmPM: 'h:mm A',
    TinyAmPm: 'A',
    TinyMonthAndYear: 'MMMM yyyy',
    TimeInDatabase: 'yyyy.MM.dd hh:mm a',
}

export const DayOfWeek = {
    Sunday: 'Sunday',
    Monday: 'Monday',
    Tuesday: 'Tuesday',
    Wednesday: 'Wednesday',
    Thursday: 'Thursday',
    Friday: 'Friday',
    Saturday: 'Saturday',
}

/**
 * Define a DateUtil that supports some functions to work with date time
 */
export class DateUtil {
    static formatDate(date, format) {
        if (date === null || date === '') {
            return '';
        }

        return dateFns.format(new Date(date), format);
    }

    static addDays(date, numberDay) {
        return dateFns.addDays(new Date(date), numberDay);
    }

    static subMonths(date, numberMonth) {
        return dateFns.subMonths(date, numberMonth);
    }

    static getMonth(date) {
        return dateFns.getMonth(date);
    }

    static getDate(date) {
        return dateFns.getDate(date);
    }

    static isLastDateOfMonth(date) {
        return dateFns.isLastDayOfMonth(date);
    }

    static addMonths(date, numberMonth) {
        return dateFns.addMonths(date, numberMonth);
    }

    static addMinutes(date, numberMinutes) {
        return dateFns.addMinutes(date, numberMinutes);
    }

    static differenceInCalendarMonths(dateOne, dateTwo) {
        return dateFns.differenceInCalendarMonths(dateOne, dateTwo);
    }

    static isBefore(dateOne, dateTwo) {
        return dateFns.isBefore(dateOne, dateTwo);
    }

    static getYear(date) {
        return dateFns.getYear(date);
    }

    static setMonth(date, month) {
        return dateFns.setMonth(date, month);
    }

    static getHours(date) {
        return dateFns.getHours(date);
    }

    static getMinutes(date) {
        if (!date || date === null) {
            return '';
        }

        return dateFns.getMinutes(date);
    }

    static setHourMinute(
        date,
        hours,
        minutes,
        second,
        milliseconds,
    ) {
        return new Date(new Date(date).setHours(hours, minutes, second, milliseconds)).getTime();
    }

    static addTimeWithOffset(date) {
        const offset = new Date().getTimezoneOffset();
        return this.setHourMinute(new Date(date).getTime() + offset * 60000, 0, 0, 0, 0);
    }

    static addTimeWithTimezone(date, timezone) {
        return new Date(date).getTime() + +timezone * 60 * 60000;
    }

    static addTimeWithOffsetAndTimezone(date, timezone) {
        const offset = new Date().getTimezoneOffset();
        return new Date(date).getTime() + offset * 60000 + +timezone * 60 * 60000;
    }

    static plusTimeWithOffsetSubTimezone(date, timezone) {
        const offset = new Date().getTimezoneOffset();
        const timeCalculate = +timezone - offset / -60;
        const timeResult = new Date(new Date(date).getTime() + timeCalculate * -60 * 60000);
        return timeResult;
    }

    static subTimeWithOffsetSubTimezone(date, timezone) {
        const offset = new Date().getTimezoneOffset();
        const timeCalculate = +timezone - offset / -60;
        const timeResult = new Date(new Date(date).getTime() - timeCalculate * -60 * 60000);
        return timeResult;
    }

    static startOfMonth(date) {
        return dateFns.startOfMonth(date);
    }

    static endOfMonth(date) {
        return dateFns.endOfMonth(date);
    }
    static startOfWeek(date) {
        return dateFns.startOfWeek(date, { weekStartsOn: 0 });
    }

    static endOfWeek(date) {
        return dateFns.endOfWeek(date);
    }

    static getTime(date) {
        return new Date(date).getTime();
    }

    static toDate(numberDate) {
        return dateFns.toDate(numberDate);
    }

    static handleFormatHour = selectHour => {
        if (selectHour) {
            let hours = parseInt(selectHour, 10);
            let minutes = 0;
            for (let i = 0; i < selectHour.length; i++) {
                if (selectHour[i] === '3' && i !== 0) {
                    minutes = 30;
                }
                if (selectHour[i] === 'P' && hours !== 12) {
                    hours = hours + 12;
                    break;
                }
                if (selectHour[i] === 'A' && hours === 12) {
                    hours = 0;
                }
            }

            return {
                hours: hours,
                minutes: minutes,
            };
        }

        return;
    };

    static isSameDay = (dateOne, dateTwo) => {
        return dateFns.isSameDay(dateOne, dateTwo);
    };

    static isAfter = (dateOne, dateTwo) => {
        return dateFns.isAfter(dateOne, dateTwo);
    };

}