import { Request, Response } from 'express';
import { QueryResult } from 'pg';
import * as dbUtil from './../utils/dbUtil';

interface Report {
    year: number,
    caregivers: {
        name: string,
        patients: string[]
    }[]
}

export const getReport = async (req: Request, res: Response) => {

    const sql = `
        SELECT
            caregiver.id      AS caregiver_id,
            caregiver.name    AS caregiver_name,
            patient.id        AS patient_id,
            patient.name      AS patient_name,
            visit.date        AS visit_date
        FROM caregiver
        JOIN visit ON visit.caregiver = caregiver.id AND EXTRACT(YEAR FROM visit.date) = '${req.params.year}'
        JOIN patient ON patient.id = visit.patient
    `;

    let result: QueryResult;
    try {
        result = await dbUtil.sqlToDB(sql, []);
        const report: Report = {
            year: parseInt(req.params.year),
            caregivers: []
        };

        const careGiversMap: any = {}
        for (let row of result.rows) {
            careGiversMap[row.caregiver_name] ?
                careGiversMap[row.caregiver_name].patients.push(row.patient_name) :
                careGiversMap[row.caregiver_name] = {
                    name: row.caregiver_name,
                    patients: [row.patient_name]
                }
        }

        report.caregivers = Object.values(careGiversMap)
        res.status(200).json(report);
    } catch (error) {
        throw new Error(error.message);
    }

}
