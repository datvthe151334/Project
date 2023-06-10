const Excel = require('exceljs');
const asyncHandler = require('../utils/async-handler');
const XLSX = require('xlsx');
const { Op } = require('sequelize');
// @ts-ignore
const { sequelize, UserMaster, Department, Setting, WorkingTimeOfYear, Point } = require('../models');
const { DB_DATABASE } = process.env;
const { QueryTypes } = require('sequelize');
module.exports = asyncHandler(async (req, res, next) => {
    try {
        const { month, year, page, size, keyword, departmentID, UserMasterID, kper } = req.query;
        const User = await UserMaster.findOne({
            where: { ID: UserMasterID },
        });
        let pmonth = '',
            umonth = '',
            umonth1 = '',
            wmonth = '',
            checkContractTypeAndStatus = '';
        (wkeyword = ''),
            (wdkeyword = ''),
            (limitsql1 = ''),
            (limitsql2 = ''),
            (limitsql3 = ` LIMIT 0,5 `),
            (udepartmentID = ''),
            (pdepartmentID = ''),
            (rankA_plus = 0),
            (rankA = 0),
            (rankB = 0),
            (rankC = 0),
            (rankD = 0);
        workdateNum = 0;
        if (month != null) {
            pmonth = `AND p.${`month`} = ${month} `;
            wmonth = `AND w.${`month`} = ${month}`;
            umonth = `AND u.${`month`} = ${month}`;
            umonth1 = `AND u.${`month`} = ${month - 1}`;
        }
        if (keyword != null) {
            wkeyword = ` where (tbl.DisplayName like '%${keyword}%') or (tbl.Account like '%${keyword}%')  `;
            wdkeyword = ` and ((tbl.DisplayName like '%${keyword}%') or (tbl.Account like '%${keyword}%')) `;
        } else {
            if (size != null) {
                limitsql1 = ` LIMIT ${(page - 1) * size || 0}, ${size || 10} `;
            }
        }
        let conditionkper = '';
        let NumberOfUser = 0;

        if (kper !== undefined) {
            conditionkper = 'where ';
            const string = kper.split(',');
            if (string.length !== 0) {
                for (let index = 0; index < string.length; index++) {
                    if (index === string.length - 1) {
                        conditionkper += `kperList.kper = '${string[index]}'`;
                    } else conditionkper += `kperList.kper = '${string[index]}' or `;
                }
            }
        }
        const setting = await Setting.findOne({
            where: { DepartmentID: departmentID },
        });

        if (departmentID != null) {
            if (month !== undefined) {
                const workingTime = await WorkingTimeOfYear.findOne({
                    where: { DepartmentID: departmentID, Month: month, Year: year },
                });
                if (workingTime) workdateNum = workingTime.WorkDateNumber;
                else {
                    const today = new Date();
                    const currentMonth = month;
                    const currentYear = year;

                    let workDays = 0;
                    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

                    for (let i = 1; i <= daysInMonth; i++) {
                        today.setDate(i);
                        const dayOfWeek = today.getDay();
                        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                            workDays++;
                        }
                    }
                    workdateNum = workDays;
                }
            } else {
                const workingTime = await WorkingTimeOfYear.findAll({
                    where: { DepartmentID: departmentID, Year: year },
                });
                if (workingTime.length !== 0) {
                    const total = workingTime.map((x) => x.WorkDateNumber);
                    if (total.length !== 0) {
                        const sum = total.reduce((total, num) => {
                            return total + num;
                        }, 0);
                        workdateNum = sum;
                    }
                } else {
                    function getWorkingDaysInYear(year) {
                        const firstDay = new Date(year, 0, 1);
                        const lastDay = new Date(year, 11, 31);
                        const weekdays = [1, 2, 3, 4, 5];
                        let workingDays = 0;

                        for (let d = firstDay; d <= lastDay; d.setDate(d.getDate() + 1)) {
                            if (weekdays.includes(d.getDay())) {
                                workingDays++;
                            }
                        }

                        return workingDays;
                    }

                    const currentYear = year;
                    workdateNum = getWorkingDaysInYear(currentYear);
                }
            }

            const countUser =
                setting.RankingIntern == 0
                    ? await UserMaster.findAll({
                          where: {
                              DepartmentID: departmentID,
                              RoleID: [3, 4],
                              Status: [1],
                              ContractType: {
                                  [Op.ne]: 2,
                              },
                          },
                      })
                    : await UserMaster.findAll({
                          where: {
                              DepartmentID: departmentID,
                              RoleID: [3, 4],
                              Status: [1],
                          },
                      });
            for (let index = 0; index < countUser.length; index++) {
                const existPoint = month
                    ? await Point.findOne({
                          where: {
                              UserMasterID: countUser[index].dataValues.ID,
                              Month: month,
                              Year: year,
                              UserContractType: countUser[index].dataValues.ContractType,
                              UserStatus: countUser[index].dataValues.Status,
                          },
                      })
                    : await Point.findOne({
                          where: {
                              UserMasterID: countUser[index].dataValues.ID,
                              Year: year,
                              UserContractType: countUser[index].dataValues.ContractType,
                              UserStatus: countUser[index].dataValues.Status,
                          },
                      });
                if (existPoint) {
                    NumberOfUser++;
                }
            }
            if (setting && NumberOfUser > 0) {
                (rankA_plus = (setting.RankA_plus * NumberOfUser) / 100),
                    (rankA = (setting.RankA * NumberOfUser) / 100),
                    (rankB = (setting.RankB * NumberOfUser) / 100),
                    (rankC = (setting.RankC * NumberOfUser) / 100),
                    (rankD = (setting.RankD * NumberOfUser) / 100);
            }
            if (setting && NumberOfUser > 0) {
                if (0 < NumberOfUser && NumberOfUser < 3 && setting.MaxTopNumber === 3) {
                    limitsql3 = ` LIMIT 0,1 `;
                } else if (2 < NumberOfUser && NumberOfUser < 5 && setting.MaxTopNumber === 5) {
                    limitsql3 = ` LIMIT 0,3 `;
                } else if (NumberOfUser > 3 && setting.MaxTopNumber === 4) {
                    limitsql3 = ` LIMIT 0,3 `;
                } else if (NumberOfUser > 1 && setting.MaxTopNumber === 2) {
                    limitsql3 = ` LIMIT 0,1 `;
                } else {
                    limitsql3 = ` LIMIT 0, ${setting.MaxTopNumber === null ? 5 : setting.MaxTopNumber} `;
                }
            }
            udepartmentID = ` AND u.DepartmentID = ${departmentID} `;
            pdepartmentID = ` AND p.DepartmentID = ${departmentID} `;
        }
        let sortingInternQuery = '';
        if (setting) {
            if (setting.RankingIntern == 0) {
                sortingInternQuery = 'CASE WHEN u.ContractType = 2 THEN 1 ELSE 0 end,';
            }
        }
        const numberA_plus = Math.round(rankA_plus);
        const numberA = Math.round(rankA);
        const numberC = Math.round(rankC);
        const numberD = Math.round(rankD);
        const numberB = NumberOfUser - numberA_plus - numberA - numberC - numberD;

        const checkA = numberA_plus + numberA;
        const checkB = checkA + numberB;
        const checkC = checkB + numberC;
        const checkD = checkC + numberD;

        const stringKper = `left join (SELECT tbl.*,CASE
          WHEN user_rank > 0 and user_rank <= ${numberA_plus}  THEN "A+"
          WHEN user_rank > ${numberA_plus} and user_rank <= ${checkA}  THEN "A"
          WHEN user_rank > ${checkA} and user_rank <= ${checkB}  THEN "B"
          WHEN user_rank > ${checkB} and user_rank <= ${checkC}  THEN "C"
          WHEN user_rank > ${checkC} and user_rank <= ${checkD}  THEN "D"
        end as kper  FROM(SELECT * FROM
          (SELECT 
            ID,
           Account,
           user_rank,
           point_per_day
         FROM 
           (
                 SELECT 
                   *, 
                   ROW_NUMBER() OVER (
                     PARTITION BY x.ID 
                     order by 
                       x.orders DESC
                   ) AS id_rank 
                 FROM 
                   (
                     SELECT 
                       t.ID, 
                       t.Avatar, 
                       t.DisplayName, 
                       t.Email, 
                       t.Account,
                       t.ContractType,  
                       total_point, 
                       point_plus,
                       point_minus,
                       total_work, 
                       point_per_day, 
                       last_point,
                       CONCAT('{"url":"',case when(select ub.level ) =1 then b.ImageURL else b2.ImageURL end,'"',',"description":"',case when(select ub.level ) =1 then b.Description else b2.Description end,'"}')  as UserBadge,
                       user_rank, 
                       ub.${`Order`} as orders 
                     FROM 
                       (
                         SELECT 
                           u.ID, 
                           u.Avatar, 
                           u.DisplayName, 
                           u.Email, 
                           u.Account,
                           u.ContractType, 
                           (
                             SELECT 
                               SUM(p.PointOfRule) 
                             FROM 
                               ${DB_DATABASE}.Point p 
                             WHERE 
                               p.UserMasterID = u.ID 
                               AND p.${`Year`} = ${year} ${pmonth} AND p.${`UserContractType`} =  u.${`ContractType`} AND p.${`UserStatus`} = u.${`Status`} 
                               AND p.Status = 3 ${pdepartmentID} 
                             GROUP BY 
                               p.UserMasterID
                           ) AS total_point,
                           (
                             SELECT 
                               p.PointOfRule
                             FROM 
                               ${DB_DATABASE}.Point p 
                             WHERE 
                               p.UserMasterID = u.ID 
                               AND p.${`Year`} = ${year} ${pmonth} AND p.${`UserContractType`} =  u.${`ContractType`} AND p.${`UserStatus`} = u.${`Status`} 
                               AND p.Status = 3 ${pdepartmentID} 
                             ORDER BY 
                               p.UpdatedDate DESC LIMIT 1
                           ) AS last_point,
                               (  SELECT 
                                   SUM(p.PointOfRule) 
                                 FROM 
                                   ${DB_DATABASE}.Point p 
                                 WHERE 
                                   p.UserMasterID = u.ID 
                                   AND p.${`Year`} = ${year} ${pmonth} AND p.${`UserContractType`} =  u.${`ContractType`} AND p.${`UserStatus`} = u.${`Status`} 
                                   AND p.Status = 3 ${pdepartmentID} 
                                   AND p.PointOfRule > 0
                                 GROUP BY 
                                   p.UserMasterID
                               ) AS point_plus, 
                                   (
                                     SELECT 
                                       SUM(p.PointOfRule) 
                                     FROM 
                                       ${DB_DATABASE}.Point p 
                                     WHERE 
                                       p.UserMasterID = u.ID 
                                       AND p.${`Year`} = ${year} ${pmonth} AND p.${`UserContractType`} =  u.${`ContractType`} AND p.${`UserStatus`} = u.${`Status`} 
                                       AND p.Status = 3 ${pdepartmentID} 
                                       AND p.PointOfRule < 0
                                     GROUP BY 
                                       p.UserMasterID
                                   ) AS point_minus,
                           case when (
                             SELECT 
                               sum(w.WorkDateNumber) 
                             FROM 
                               ${DB_DATABASE}.WorkingTime w 
                             where 
                               w.UserMasterID = u.ID 
                               and w.${`Year`} = ${year} ${wmonth} 
                             group by 
                               w.UserMasterID
                           ) is null then ${workdateNum}
                           when (
                            SELECT 
                              sum(w.WorkDateNumber) 
                            FROM 
                              ${DB_DATABASE}.WorkingTime w 
                            where 
                              w.UserMasterID = u.ID 
                              and w.${`Year`} = ${year} ${wmonth} 
                            group by 
                              w.UserMasterID
                          ) = 0 then ${workdateNum}
                           else (
                             SELECT 
                               sum(w.WorkDateNumber) 
                             FROM 
                               ${DB_DATABASE}.WorkingTime w 
                             where 
                               w.UserMasterID = u.ID 
                               and w.${`Year`} = ${year} ${wmonth} 
                             group by 
                               w.UserMasterID
                           ) end AS total_work, 
                           case when (
                             TRUNCATE (
                               (
                                 SELECT 
                                   SUM(p.PointOfRule) 
                                 from 
                                   ${DB_DATABASE}.Point p 
                                 WHERE 
                                   p.UserMasterID = u.ID 
                                   AND p.${`Year`} = ${year} ${pmonth} AND p.${`UserContractType`} =  u.${`ContractType`} AND p.${`UserStatus`} = u.${`Status`} 
                                   AND p.Status = 3 ${pdepartmentID} 
                                 GROUP BY 
                                   p.UserMasterID
                               )/ case when (
                                 SELECT 
                                   sum(w.WorkDateNumber) 
                                 FROM 
                                   ${DB_DATABASE}.WorkingTime w 
                                 where 
                                   w.UserMasterID = u.ID 
                                   and w.${`Year`} = ${year} ${wmonth} 
                                 group by 
                                   w.UserMasterID
                               ) is null then ${workdateNum}
                               when (
                                SELECT 
                                  sum(w.WorkDateNumber) 
                                FROM 
                                  ${DB_DATABASE}.WorkingTime w 
                                where 
                                  w.UserMasterID = u.ID 
                                  and w.${`Year`} = ${year} ${wmonth} 
                                group by 
                                  w.UserMasterID
                              ) = 0 then ${workdateNum}
                               else (
                                 SELECT 
                                   sum(w.WorkDateNumber) 
                                 FROM 
                                   ${DB_DATABASE}.WorkingTime w 
                                 where 
                                   w.UserMasterID = u.ID 
                                   and w.${`Year`} = ${year} ${wmonth} 
                                 group by 
                                   w.UserMasterID
                               ) end, 
                               2
                             )
                           ) is null then 0 else (
                             TRUNCATE (
                               (
                                 SELECT 
                                   SUM(p.PointOfRule) 
                                 from 
                                   ${DB_DATABASE}.Point p 
                                 WHERE 
                                   p.UserMasterID = u.ID 
                                   AND p.${`Year`} = ${year} ${pmonth} AND p.${`UserContractType`} =  u.${`ContractType`} AND p.${`UserStatus`} = u.${`Status`} 
                                   AND p.Status = 3 ${pdepartmentID} 
                                 GROUP BY 
                                   p.UserMasterID
                               )/ case when (
                                 SELECT 
                                   sum(w.WorkDateNumber) 
                                 FROM 
                                   ${DB_DATABASE}.WorkingTime w 
                                 where 
                                   w.UserMasterID = u.ID 
                                   and w.${`Year`} = ${year} ${wmonth} 
                                 group by 
                                   w.UserMasterID
                               ) is null then ${workdateNum} else (
                                 SELECT 
                                   sum(w.WorkDateNumber) 
                                 FROM 
                                   ${DB_DATABASE}.WorkingTime w 
                                 where 
                                   w.UserMasterID = u.ID 
                                   and w.${`Year`} = ${year} ${wmonth} 
                                 group by 
                                   w.UserMasterID
                               ) end, 
                               2
                             )
                           ) end AS point_per_day, 
                           DENSE_RANK() OVER (
                             ORDER BY
                             CASE WHEN (SELECT
                              Count(p.ID)
                            from
                              ${DB_DATABASE}.Point p
                            WHERE
                              p.UserMasterID = u.ID
                              AND p.${`Year`} = ${year} ${pmonth} AND p.${`UserContractType`} =  u.${`ContractType`} AND p.${`UserStatus`} = ${
            User.Status
        } 
                             AND p.Status = 3 ${pdepartmentID} 
                            GROUP BY
                              p.UserMasterID) = 0 or (SELECT
                                Count(p.ID)
                              from
                                ${DB_DATABASE}.Point p
                              WHERE
                                p.UserMasterID = u.ID
                                AND p.${`Year`} = ${year} ${pmonth} AND p.${`UserContractType`} =  u.${`ContractType`} AND p.${`UserStatus`} = u.${`Status`} 
                               AND p.Status = 3 ${pdepartmentID} 
                              GROUP BY
                                p.UserMasterID) is null then 1 ELSE 0 end,
                              ${sortingInternQuery}
                               case when (
                                 TRUNCATE (
                                   (
                                     SELECT
                                       SUM(p.PointOfRule)
                                     from
                                       ${DB_DATABASE}.Point p
                                     WHERE
                                       p.UserMasterID = u.ID
                                       AND p.${`Year`} = ${year} ${pmonth} AND p.${`UserContractType`} =  u.${`ContractType`} AND p.${`UserStatus`} = u.${`Status`} 
                                      AND p.Status = 3 ${pdepartmentID} 
                                     GROUP BY
                                       p.UserMasterID
                                   )/ case when (
                                     SELECT
                                       sum(w.WorkDateNumber)
                                     FROM
                                       ${DB_DATABASE}.WorkingTime w
                                     where
                                       w.UserMasterID = u.ID
                                        and w.${`Year`} = ${year} ${wmonth}
                                     group by
                                       w.UserMasterID
                                   ) is null then ${workdateNum} else (
                                     SELECT
                                       sum(w.WorkDateNumber)
                                     FROM
                                       ${DB_DATABASE}.WorkingTime w
                                     where
                                       w.UserMasterID = u.ID
                                        and w.${`Year`} = ${year} ${wmonth}
                                     group by
                                       w.UserMasterID
                                   ) end,
                                   2
                                 )
                               ) is null then 0 else (
                                 TRUNCATE (
                                   (
                                     SELECT
                                       SUM(p.PointOfRule)
                                     from
                                       ${DB_DATABASE}.Point p
                                     WHERE
                                       p.UserMasterID = u.ID
                                       AND p.${`Year`} = ${year} ${pmonth} AND p.${`UserContractType`} =  u.${`ContractType`} AND p.${`UserStatus`} = u.${`Status`} 
                                     AND p.Status = 3 ${pdepartmentID} 
                                     GROUP BY
                                       p.UserMasterID
                                   )/ case when (
                                     SELECT
                                       sum(w.WorkDateNumber)
                                     FROM
                                       ${DB_DATABASE}.WorkingTime w
                                     where
                                       w.UserMasterID = u.ID
                                        and w.${`Year`} = ${year} ${wmonth}
                                     group by
                                       w.UserMasterID
                                   ) is null then ${workdateNum} else (
                                     SELECT
                                       sum(w.WorkDateNumber)
                                     FROM
                                       ${DB_DATABASE}.WorkingTime w
                                     where
                                       w.UserMasterID = u.ID
                                        and w.${`Year`} = ${year} ${wmonth}
                                     group by
                                       w.UserMasterID
                                   ) end,
                                   2
                                 )
                               ) end desc,
                               (
                                SELECT
                                  SUM(p.PointOfRule)
                                FROM
                                  ${DB_DATABASE}.Point p
                                WHERE
                                  p.UserMasterID = u.ID
                                  AND p.${`Year`} = ${year} ${pmonth} AND p.${`UserContractType`} =  u.${`ContractType`} AND p.${`UserStatus`} = u.${`Status`} 
                                  AND p.Status = 3 ${pdepartmentID} 
                                GROUP BY
                                  p.UserMasterID
                              ) desc,
                              case when (
                                SELECT
                                  sum(w.WorkDateNumber)
                                FROM
                                  ${DB_DATABASE}.WorkingTime w
                                where
                                  w.UserMasterID = u.ID
                                   and w.${`Year`} = ${year} ${wmonth}
                                group by
                                  w.UserMasterID
                              ) is null then ${workdateNum} else (
                                SELECT
                                  sum(w.WorkDateNumber)
                                FROM
                                  ${DB_DATABASE}.WorkingTime w
                                where
                                  w.UserMasterID = u.ID
                                   and w.${`Year`} = ${year} ${wmonth}
                                group by
                                  w.UserMasterID
                              ) end desc,
                              (
                                SELECT
                                  SUM(p.Times)
                                FROM
                                  ${DB_DATABASE}.Point p
                                WHERE
                                  p.UserMasterID = u.ID
                                  AND p.${`Year`} = ${year} ${pmonth} AND p.${`UserContractType`} =  u.${`ContractType`} AND p.${`UserStatus`} = u.${`Status`} 
                                  AND p.Status = 3 ${pdepartmentID} 
                                  AND p.PointOfRule > 0
                                GROUP BY
                                  p.UserMasterID
                              ) desc ,
                              (
                                SELECT
                                  SUM(p.Times)
                                FROM
                                  ${DB_DATABASE}.Point p
                                WHERE
                                  p.UserMasterID = u.ID
                                  AND p.${`Year`} = ${year} ${pmonth} AND p.${`UserContractType`} =  u.${`ContractType`} AND p.${`UserStatus`} = u.${`Status`} 
                                  AND p.Status = 3 ${pdepartmentID} 
                                  AND p.PointOfRule < 0
                                GROUP BY
                                  p.UserMasterID
                              ) asc ,
                              (
                                SELECT
                                  SUM(p.PointOfRule)
                                FROM
                                  ${DB_DATABASE}.Point p
                                WHERE
                                  p.UserMasterID = u.ID
                                  AND p.${`Year`} = ${
            year - 1
        } ${pmonth} AND p.${`UserContractType`} =  u.${`ContractType`} AND p.${`UserStatus`} = u.${`Status`} 
                                  AND p.Status = 3 ${pdepartmentID} 
                                GROUP BY
                                  p.UserMasterID
                              ) desc,
                              (
                                SELECT
                                  SUM(p.PointOfRule / p.Times )
                                FROM
                                  ${DB_DATABASE}.Point p
                                WHERE
                                  p.UserMasterID = u.ID
                                  AND p.${`Year`} = ${year} ${pmonth} AND p.${`UserContractType`} =  u.${`ContractType`} AND p.${`UserStatus`} = u.${`Status`} 
                                  AND p.Status = 3 ${pdepartmentID} 
                                GROUP BY
                                  p.UserMasterID
                              ) desc,
                               (
                                     SELECT
                                       SUM(p.PointOfRule)
                                     FROM
                                       ${DB_DATABASE}.Point p
                                     WHERE
                                       p.UserMasterID = u.ID
                                       AND p.${`Year`} = ${year} ${pmonth} AND p.${`UserContractType`} =  u.${`ContractType`} AND p.${`UserStatus`} = u.${`Status`} 
                                       AND p.Status = 3 ${pdepartmentID} 
                                       AND p.PointOfRule > 0
                                     GROUP BY
                                       p.UserMasterID
                                   ) desc , (
                                     SELECT
                                       SUM(p.PointOfRule)
                                     FROM
                                       ${DB_DATABASE}.Point p
                                     WHERE
                                       p.UserMasterID = u.ID
                                        AND p.${`Year`} = ${year} ${pmonth} AND p.${`UserContractType`} =  u.${`ContractType`} AND p.${`UserStatus`} = u.${`Status`} 
                                       AND p.Status = 3 ${pdepartmentID} 
                                       AND p.PointOfRule < 0
                                     GROUP BY
                                       p.UserMasterID
                                   ) asc,   (
                             SELECT
                               p.PointOfRule
                             FROM
                               ${DB_DATABASE}.Point p
                             WHERE
                               p.UserMasterID = u.ID
                               AND p.${`Year`} = ${year} ${pmonth} AND p.${`UserContractType`} =  u.${`ContractType`} AND p.${`UserStatus`} = u.${`Status`} 
                 AND p.Status = 3 ${pdepartmentID} 
                             ORDER BY
                               p.UpdatedDate DESC LIMIT 1
                           )  desc,  (SELECT
                                       u.Account 
                                     FROM
                                       ${DB_DATABASE}.UserMaster u2  
                                     WHERE
                                       u2.ID = u.ID
                                   ) asc
                           ) user_rank 
                         FROM 
                           ${DB_DATABASE}.UserMaster u 
                         WHERE 
                           u.RoleID <> 2 
                           AND u.Status = 1 ${udepartmentID} 
                         ORDER BY 
                           point_per_day desc
                       ) t 
                       LEFT JOIN (select * from ${DB_DATABASE}.UserBadge ubRaw where ubRaw.Status = 1  ORDER BY ID DESC) ub ON t.ID = ub.UserMasterID 
                       LEFT JOIN ${DB_DATABASE}.Badge b ON b.ID = ub.BadgeID
                       LEFT JOIN ${DB_DATABASE}.BadgeLevel b2 ON b.ID = b2.BadgeID  and ub.Level = b2.LevelNumber
                   ) x
               ) ranks 
               LEFT JOIN (
                 SELECT 
                   * 
                 FROM 
                   (
                     SELECT 
                       *, 
                       ROW_NUMBER() OVER (
                         partition by get_user_nickname.UserMasterID
                       ) AS rank_nickname 
                     FROM 
                       (
                         SELECT 
                           n.UserMasterID, 
                           n.Name AS user_nickname, 
                           COUNT(n.ID) as total_nickname,
                           SUM(u.Vote = 1) AS total_vote 
                         FROM 
                           ${DB_DATABASE}.UserNickname u 
                           INNER JOIN ${DB_DATABASE}.Nickname n ON u.NicknameID = n.ID 
                         GROUP BY 
                         u.NicknameID, 
                         n.Name 
                         ORDER BY 
                           SUM(u.Vote = 1) DESC
                       ) get_user_nickname
                   ) rankss 
                 WHERE 
                   rank_nickname <= 1
               ) z ON z.UserMasterID = ranks.ID 
             WHERE 
               id_rank <= 30
           ) y  
         GROUP BY 
           ID 
         ORDER BY 
         user_rank asc, point_per_day desc ${limitsql2}) tbl ) kperList on tbl.ID = kperList.ID ${conditionkper}`;
        const lbStrQuery = `SELECT tbl.*,kperList.kper FROM
          (SELECT 
           ID, 
           Avatar, 
           DisplayName, 
           Email, 
           Account, 
           user_nickname, 
           total_nickname, 
           total_point, 
           point_plus,
           point_minus,
           last_point,
           total_work, 
           point_per_day, 
           group_concat(UserBadge SEPARATOR '|') AS badge_names, 
           user_rank
            
         FROM 
           (
             SELECT 
               * 
             FROM
               (
                 SELECT 
                   *, 
                   ROW_NUMBER() OVER (
                     PARTITION BY x.ID 
                     order by 
                       x.orders DESC
                   ) AS id_rank 
                 FROM 
                   (
                     SELECT 
                       t.ID, 
                       t.Avatar, 
                       t.DisplayName, 
                       t.Email, 
                       t.Account,
                       t.ContractType,  
                       total_point, 
                       point_plus,
                       point_minus,
                       total_work, 
                       point_per_day, 
                       last_point,
                       CONCAT('{"url":"',case when(select ub.level ) =1 then b.ImageURL else b2.ImageURL end,'"',',"description":"',case when(select ub.level ) =1 then b.Description else b2.Description end,'"}')  as UserBadge,
                       user_rank, 
                       ub.${`Order`} as orders 
                     FROM 
                       (
                         SELECT 
                           u.ID, 
                           u.Avatar, 
                           u.DisplayName, 
                           u.Email, 
                           u.Account,
                           u.ContractType, 
                           (
                             SELECT 
                               SUM(p.PointOfRule) 
                             FROM 
                               ${DB_DATABASE}.Point p 
                             WHERE 
                               p.UserMasterID = u.ID 
                               AND p.${`Year`} = ${year} ${pmonth} AND p.${`UserContractType`} =  u.${`ContractType`} AND p.${`UserStatus`} = u.${`Status`} 
                               AND p.Status = 3 ${pdepartmentID} 
                             GROUP BY 
                               p.UserMasterID
                           ) AS total_point,
                           (
                             SELECT 
                               p.PointOfRule
                             FROM 
                               ${DB_DATABASE}.Point p 
                             WHERE 
                               p.UserMasterID = u.ID 
                               AND p.${`Year`} = ${year} ${pmonth} AND p.${`UserContractType`} =  u.${`ContractType`} AND p.${`UserStatus`} = u.${`Status`} 
                               AND p.Status = 3 ${pdepartmentID} 
                             ORDER BY 
                               p.UpdatedDate DESC LIMIT 1
                           ) AS last_point,
                               (  SELECT 
                                   SUM(p.PointOfRule) 
                                 FROM 
                                   ${DB_DATABASE}.Point p 
                                 WHERE 
                                   p.UserMasterID = u.ID 
                                   AND p.${`Year`} = ${year} ${pmonth} AND p.${`UserContractType`} =  u.${`ContractType`} AND p.${`UserStatus`} = u.${`Status`} 
                                   AND p.Status = 3 ${pdepartmentID} 
                                   AND p.PointOfRule > 0
                                 GROUP BY 
                                   p.UserMasterID
                               ) AS point_plus, 
                                   (
                                     SELECT 
                                       SUM(p.PointOfRule) 
                                     FROM 
                                       ${DB_DATABASE}.Point p 
                                     WHERE 
                                       p.UserMasterID = u.ID 
                                       AND p.${`Year`} = ${year} ${pmonth} AND p.${`UserContractType`} =  u.${`ContractType`} AND p.${`UserStatus`} = u.${`Status`} 
                                       AND p.Status = 3 ${pdepartmentID} 
                                       AND p.PointOfRule < 0
                                     GROUP BY 
                                       p.UserMasterID
                                   ) AS point_minus,
                           case when (
                             SELECT 
                               sum(w.WorkDateNumber) 
                             FROM 
                               ${DB_DATABASE}.WorkingTime w 
                             where 
                               w.UserMasterID = u.ID 
                               and w.${`Year`} = ${year} ${wmonth} 
                             group by 
                               w.UserMasterID
                           ) is null then ${workdateNum}
                           when (
                            SELECT 
                              sum(w.WorkDateNumber) 
                            FROM 
                              ${DB_DATABASE}.WorkingTime w 
                            where 
                              w.UserMasterID = u.ID 
                              and w.${`Year`} = ${year} ${wmonth} 
                            group by 
                              w.UserMasterID
                          ) = 0 then ${workdateNum}
                           else (
                             SELECT 
                               sum(w.WorkDateNumber) 
                             FROM 
                               ${DB_DATABASE}.WorkingTime w 
                             where 
                               w.UserMasterID = u.ID 
                               and w.${`Year`} = ${year} ${wmonth} 
                             group by 
                               w.UserMasterID
                           ) end AS total_work, 
                           case when (
                             TRUNCATE (
                               (
                                 SELECT 
                                   SUM(p.PointOfRule) 
                                 from 
                                   ${DB_DATABASE}.Point p 
                                 WHERE 
                                   p.UserMasterID = u.ID 
                                   AND p.${`Year`} = ${year} ${pmonth} AND p.${`UserContractType`} =  u.${`ContractType`} AND p.${`UserStatus`} = u.${`Status`} 
                                   AND p.Status = 3 ${pdepartmentID} 
                                 GROUP BY 
                                   p.UserMasterID
                               )/ case when (
                                 SELECT 
                                   sum(w.WorkDateNumber) 
                                 FROM 
                                   ${DB_DATABASE}.WorkingTime w 
                                 where 
                                   w.UserMasterID = u.ID 
                                   and w.${`Year`} = ${year} ${wmonth} 
                                 group by 
                                   w.UserMasterID
                               ) is null then ${workdateNum}
                               when (
                                SELECT 
                                  sum(w.WorkDateNumber) 
                                FROM 
                                  ${DB_DATABASE}.WorkingTime w 
                                where 
                                  w.UserMasterID = u.ID 
                                  and w.${`Year`} = ${year} ${wmonth} 
                                group by 
                                  w.UserMasterID
                              ) = 0 then ${workdateNum}
                               else (
                                 SELECT 
                                   sum(w.WorkDateNumber) 
                                 FROM 
                                   ${DB_DATABASE}.WorkingTime w 
                                 where 
                                   w.UserMasterID = u.ID 
                                   and w.${`Year`} = ${year} ${wmonth} 
                                 group by 
                                   w.UserMasterID
                               ) end, 
                               2
                             )
                           ) is null then 0 else (
                             TRUNCATE (
                               (
                                 SELECT 
                                   SUM(p.PointOfRule) 
                                 from 
                                   ${DB_DATABASE}.Point p 
                                 WHERE 
                                   p.UserMasterID = u.ID 
                                   AND p.${`Year`} = ${year} ${pmonth} AND p.${`UserContractType`} =  u.${`ContractType`} AND p.${`UserStatus`} = u.${`Status`} 
                                   AND p.Status = 3 ${pdepartmentID} 
                                 GROUP BY 
                                   p.UserMasterID
                               )/ case when (
                                 SELECT 
                                   sum(w.WorkDateNumber) 
                                 FROM 
                                   ${DB_DATABASE}.WorkingTime w 
                                 where 
                                   w.UserMasterID = u.ID 
                                   and w.${`Year`} = ${year} ${wmonth} 
                                 group by 
                                   w.UserMasterID
                               ) is null then ${workdateNum} else (
                                 SELECT 
                                   sum(w.WorkDateNumber) 
                                 FROM 
                                   ${DB_DATABASE}.WorkingTime w 
                                 where 
                                   w.UserMasterID = u.ID 
                                   and w.${`Year`} = ${year} ${wmonth} 
                                 group by 
                                   w.UserMasterID
                               ) end, 
                               2
                             )
                           ) end AS point_per_day, 
                           DENSE_RANK() OVER (
                             ORDER BY
                             CASE WHEN (SELECT
                              Count(p.ID)
                            from
                              ${DB_DATABASE}.Point p
                            WHERE
                              p.UserMasterID = u.ID
                              AND p.${`Year`} = ${year} ${pmonth} AND p.${`UserContractType`} =  u.${`ContractType`} AND p.${`UserStatus`} = ${
            User.Status
        } 
                             AND p.Status = 3 ${pdepartmentID} 
                            GROUP BY
                              p.UserMasterID) = 0 or (SELECT
                                Count(p.ID)
                              from
                                ${DB_DATABASE}.Point p
                              WHERE
                                p.UserMasterID = u.ID
                                AND p.${`Year`} = ${year} ${pmonth} AND p.${`UserContractType`} =  u.${`ContractType`} AND p.${`UserStatus`} = u.${`Status`} 
                               AND p.Status = 3 ${pdepartmentID} 
                              GROUP BY
                                p.UserMasterID) is null  then 1 ELSE 0 end,
                              ${sortingInternQuery}
                               case when (
                                 TRUNCATE (
                                   (
                                     SELECT
                                       SUM(p.PointOfRule)
                                     from
                                       ${DB_DATABASE}.Point p
                                     WHERE
                                       p.UserMasterID = u.ID
                                       AND p.${`Year`} = ${year} ${pmonth} AND p.${`UserContractType`} =  u.${`ContractType`} AND p.${`UserStatus`} = u.${`Status`} 
                                      AND p.Status = 3 ${pdepartmentID} 
                                     GROUP BY
                                       p.UserMasterID
                                   )/ case when (
                                     SELECT
                                       sum(w.WorkDateNumber)
                                     FROM
                                       ${DB_DATABASE}.WorkingTime w
                                     where
                                       w.UserMasterID = u.ID
                                        and w.${`Year`} = ${year} ${wmonth}
                                     group by
                                       w.UserMasterID
                                   ) is null then ${workdateNum} else (
                                     SELECT
                                       sum(w.WorkDateNumber)
                                     FROM
                                       ${DB_DATABASE}.WorkingTime w
                                     where
                                       w.UserMasterID = u.ID
                                        and w.${`Year`} = ${year} ${wmonth}
                                     group by
                                       w.UserMasterID
                                   ) end,
                                   2
                                 )
                               ) is null then 0 else (
                                 TRUNCATE (
                                   (
                                     SELECT
                                       SUM(p.PointOfRule)
                                     from
                                       ${DB_DATABASE}.Point p
                                     WHERE
                                       p.UserMasterID = u.ID
                                       AND p.${`Year`} = ${year} ${pmonth} AND p.${`UserContractType`} =  u.${`ContractType`} AND p.${`UserStatus`} = u.${`Status`} 
                                     AND p.Status = 3 ${pdepartmentID} 
                                     GROUP BY
                                       p.UserMasterID
                                   )/ case when (
                                     SELECT
                                       sum(w.WorkDateNumber)
                                     FROM
                                       ${DB_DATABASE}.WorkingTime w
                                     where
                                       w.UserMasterID = u.ID
                                        and w.${`Year`} = ${year} ${wmonth}
                                     group by
                                       w.UserMasterID
                                   ) is null then ${workdateNum} else (
                                     SELECT
                                       sum(w.WorkDateNumber)
                                     FROM
                                       ${DB_DATABASE}.WorkingTime w
                                     where
                                       w.UserMasterID = u.ID
                                        and w.${`Year`} = ${year} ${wmonth}
                                     group by
                                       w.UserMasterID
                                   ) end,
                                   2
                                 )
                               ) end desc,
                               (
                                SELECT
                                  SUM(p.PointOfRule)
                                FROM
                                  ${DB_DATABASE}.Point p
                                WHERE
                                  p.UserMasterID = u.ID
                                  AND p.${`Year`} = ${year} ${pmonth} AND p.${`UserContractType`} =  u.${`ContractType`} AND p.${`UserStatus`} = u.${`Status`} 
                                  AND p.Status = 3 ${pdepartmentID} 
                                GROUP BY
                                  p.UserMasterID
                              ) desc,
                              case when (
                                SELECT
                                  sum(w.WorkDateNumber)
                                FROM
                                  ${DB_DATABASE}.WorkingTime w
                                where
                                  w.UserMasterID = u.ID
                                   and w.${`Year`} = ${year} ${wmonth}
                                group by
                                  w.UserMasterID
                              ) is null then ${workdateNum} else (
                                SELECT
                                  sum(w.WorkDateNumber)
                                FROM
                                  ${DB_DATABASE}.WorkingTime w
                                where
                                  w.UserMasterID = u.ID
                                   and w.${`Year`} = ${year} ${wmonth}
                                group by
                                  w.UserMasterID
                              ) end desc,
                              (
                                SELECT
                                  SUM(p.Times)
                                FROM
                                  ${DB_DATABASE}.Point p
                                WHERE
                                  p.UserMasterID = u.ID
                                  AND p.${`Year`} = ${year} ${pmonth} AND p.${`UserContractType`} =  u.${`ContractType`} AND p.${`UserStatus`} = u.${`Status`} 
                                  AND p.Status = 3 ${pdepartmentID} 
                                  AND p.PointOfRule > 0
                                GROUP BY
                                  p.UserMasterID
                              ) desc ,
                              (
                                SELECT
                                  SUM(p.Times)
                                FROM
                                  ${DB_DATABASE}.Point p
                                WHERE
                                  p.UserMasterID = u.ID
                                  AND p.${`Year`} = ${year} ${pmonth} AND p.${`UserContractType`} =  u.${`ContractType`} AND p.${`UserStatus`} = u.${`Status`} 
                                  AND p.Status = 3 ${pdepartmentID} 
                                  AND p.PointOfRule < 0
                                GROUP BY
                                  p.UserMasterID
                              ) asc ,
                              (
                                SELECT
                                  SUM(p.PointOfRule)
                                FROM
                                  ${DB_DATABASE}.Point p
                                WHERE
                                  p.UserMasterID = u.ID
                                  AND p.${`Year`} = ${
            year - 1
        } ${pmonth} AND p.${`UserContractType`} =  u.${`ContractType`} AND p.${`UserStatus`} = u.${`Status`} 
                                  AND p.Status = 3 ${pdepartmentID} 
                                GROUP BY
                                  p.UserMasterID
                              ) desc,
                              (
                                SELECT
                                  SUM(p.PointOfRule / p.Times )
                                FROM
                                  ${DB_DATABASE}.Point p
                                WHERE
                                  p.UserMasterID = u.ID
                                  AND p.${`Year`} = ${year} ${pmonth} AND p.${`UserContractType`} =  u.${`ContractType`} AND p.${`UserStatus`} = u.${`Status`} 
                                  AND p.Status = 3 ${pdepartmentID} 
                                GROUP BY
                                  p.UserMasterID
                              ) desc,
                               (
                                     SELECT
                                       SUM(p.PointOfRule)
                                     FROM
                                       ${DB_DATABASE}.Point p
                                     WHERE
                                       p.UserMasterID = u.ID
                                       AND p.${`Year`} = ${year} ${pmonth} AND p.${`UserContractType`} =  u.${`ContractType`} AND p.${`UserStatus`} = u.${`Status`} 
                                       AND p.Status = 3 ${pdepartmentID} 
                                       AND p.PointOfRule > 0
                                     GROUP BY
                                       p.UserMasterID
                                   ) desc , (
                                     SELECT
                                       SUM(p.PointOfRule)
                                     FROM
                                       ${DB_DATABASE}.Point p
                                     WHERE
                                       p.UserMasterID = u.ID
                                        AND p.${`Year`} = ${year} ${pmonth} AND p.${`UserContractType`} =  u.${`ContractType`} AND p.${`UserStatus`} = u.${`Status`} 
                                       AND p.Status = 3 ${pdepartmentID} 
                                       AND p.PointOfRule < 0
                                     GROUP BY
                                       p.UserMasterID
                                   ) asc,   (
                             SELECT
                               p.PointOfRule
                             FROM
                               ${DB_DATABASE}.Point p
                             WHERE
                               p.UserMasterID = u.ID
                               AND p.${`Year`} = ${year} ${pmonth} AND p.${`UserContractType`} =  u.${`ContractType`} AND p.${`UserStatus`} = u.${`Status`} 
                 AND p.Status = 3 ${pdepartmentID} 
                             ORDER BY
                               p.UpdatedDate DESC LIMIT 1
                           )  desc,  (SELECT
                                       u.Account 
                                     FROM
                                       ${DB_DATABASE}.UserMaster u2  
                                     WHERE
                                       u2.ID = u.ID
                                   ) asc
                           ) user_rank 
                         FROM 
                           ${DB_DATABASE}.UserMaster u 
                         WHERE 
                           u.RoleID <> 2                     
                           AND u.Status = 1 ${udepartmentID} 
                         ORDER BY 
                           point_per_day desc
                       ) t 
                       LEFT JOIN (select * from ${DB_DATABASE}.UserBadge ubRaw where ubRaw.Status = 1  ORDER BY ID DESC) ub ON t.ID = ub.UserMasterID 
                       LEFT JOIN ${DB_DATABASE}.Badge b ON b.ID = ub.BadgeID
                       LEFT JOIN ${DB_DATABASE}.BadgeLevel b2 ON b.ID = b2.BadgeID  and ub.Level = b2.LevelNumber
                   ) x
               ) ranks 
               LEFT JOIN (
                 SELECT 
                   * 
                 FROM 
                   (
                     SELECT 
                       *, 
                       ROW_NUMBER() OVER (
                         partition by get_user_nickname.UserMasterID
                       ) AS rank_nickname 
                     FROM 
                       (
                         SELECT 
                           n.UserMasterID, 
                           n.Name AS user_nickname, 
                           COUNT(n.ID) as total_nickname,
                           SUM(u.Vote = 1) AS total_vote 
                         FROM 
                           ${DB_DATABASE}.UserNickname u 
                           INNER JOIN ${DB_DATABASE}.Nickname n ON u.NicknameID = n.ID 
                         GROUP BY 
                         u.NicknameID, 
                         n.Name 
                         ORDER BY 
                           SUM(u.Vote = 1) DESC
                       ) get_user_nickname
                   ) rankss 
                 WHERE 
                   rank_nickname <= 1
               ) z ON z.UserMasterID = ranks.ID 
             WHERE 
               id_rank <= 30
           ) y 
         GROUP BY 
           ID 
         ORDER BY 
         user_rank asc, point_per_day desc ${limitsql2}) tbl  ${stringKper} ${wkeyword} 
          `;
        const LeaderBoard = await sequelize.query(`${lbStrQuery} `, { type: QueryTypes.SELECT });

        const leaderBoardExcel = LeaderBoard;

        const workbook = new Excel.Workbook();

        const leader = workbook.addWorksheet('Rankingboard');
        const headerStyle = {
            fill: {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'ff3271a8' }, // Change to desired color code
            },
            font: {
                name: 'Times New Roman',
                size: 11,
                bold: true,
                color: { argb: 'FFFFFF' },
                // Set any other font properties as needed
            },

            border: {
                bottom: { style: 'thin' },
                top: { style: 'thin' },
                left: { style: 'thin' },
                right: { style: 'thin' },
            },
            alignment: {
                horizontal: 'center',
            },
        };
        if (setting.IsKper === true) {
            leader.columns = [
                { header: 'Rank', key: 'user_rank', width: 6 },
                { header: 'Kper', key: 'kper', width: 6 },
                { header: 'Employee', key: 'DisplayName', width: 30 },
                { header: 'Account', key: 'Account', width: 16 },
                { header: 'Total points', key: 'total_point', width: 12 },
                { header: 'Average per day', key: 'point_per_day', width: 16.5 },
                { header: 'Point Plus', key: 'point_plus', width: 11 },
                { header: 'Point Minus', key: 'point_minus', width: 12 },
                { header: 'Workdays', key: 'total_work', width: 10.5 },
            ];

            leader.getRow(1).eachCell((cell) => {
                cell.style = headerStyle;
            });
            LeaderBoard.forEach((element) => {
                if (element.point_minus === null) element.point_minus = 0;
                if (element.point_plus === null) element.point_plus = 0;
            });
            leader.addRows(LeaderBoard);

            const columnA = leader.getColumn('A');
            columnA.eachCell((cell, rowNumber) => {
                if (rowNumber > 1 && rowNumber <= leader.rowCount) {
                    cell.alignment = { horizontal: 'center' };
                }
            });

            const columnB = leader.getColumn('B');
            columnB.eachCell((cell, rowNumber) => {
                if (rowNumber > 1 && rowNumber <= leader.rowCount) {
                    cell.alignment = { horizontal: 'center' };
                }
            });

            const columnH = leader.getColumn('H');
            columnH.eachCell((cell, rowNumber) => {
                if (rowNumber > 1 && rowNumber <= leader.rowCount) {
                    cell.alignment = { horizontal: 'right' };
                }
            });

            const columnE = leader.getColumn('E');
            columnE.eachCell((cell, rowNumber) => {
                if (rowNumber > 1 && rowNumber <= leader.rowCount) {
                    cell.alignment = { horizontal: 'right' };
                }
            });

            const columnF = leader.getColumn('F');
            columnF.eachCell((cell, rowNumber) => {
                if (rowNumber > 1 && rowNumber <= leader.rowCount) {
                    cell.alignment = { horizontal: 'right' };
                }
            });

            const columnG = leader.getColumn('G');
            columnG.eachCell((cell, rowNumber) => {
                if (rowNumber > 1 && rowNumber <= leader.rowCount) {
                    cell.alignment = { horizontal: 'right' };
                }
            });

            const columnI = leader.getColumn('I');
            columnI.eachCell((cell, rowNumber) => {
                if (rowNumber > 1 && rowNumber <= leader.rowCount) {
                    cell.alignment = { horizontal: 'right' };
                }
            });
        } else {
            leader.columns = [
                { header: 'Rank', key: 'user_rank', width: 6 },
                // { header: 'Kper', key: 'kper', width: 6 },
                { header: 'Employee', key: 'DisplayName', width: 30 },
                { header: 'Account', key: 'Account', width: 16 },
                { header: 'Total points', key: 'total_point', width: 12 },
                { header: 'Average per day', key: 'point_per_day', width: 16.5 },
                { header: 'Point Plus', key: 'point_plus', width: 11 },
                { header: 'Point Minus', key: 'point_minus', width: 12 },
                { header: 'Workdays', key: 'total_work', width: 10.5 },
            ];
            leader.getRow(1).eachCell((cell) => {
                cell.style = headerStyle;
            });

            LeaderBoard.forEach((element) => {
                if (element.point_minus === null) element.point_minus = 0;
                if (element.point_plus === null) element.point_plus = 0;
            });
            leader.addRows(LeaderBoard);

            const columnA = leader.getColumn('A');
            columnA.eachCell((cell, rowNumber) => {
                if (rowNumber > 1 && rowNumber <= leader.rowCount) {
                    cell.alignment = { horizontal: 'center' };
                }
            });

            const columnB = leader.getColumn('B');
            columnB.eachCell((cell, rowNumber) => {
                if (rowNumber > 1 && rowNumber <= leader.rowCount) {
                    cell.alignment = { horizontal: 'left' };
                }
            });

            const columnH = leader.getColumn('H');
            columnH.eachCell((cell, rowNumber) => {
                if (rowNumber > 1 && rowNumber <= leader.rowCount) {
                    cell.alignment = { horizontal: 'right' };
                }
            });

            const columnE = leader.getColumn('E');
            columnE.eachCell((cell, rowNumber) => {
                if (rowNumber > 1 && rowNumber <= leader.rowCount) {
                    cell.alignment = { horizontal: 'right' };
                }
            });

            const columnF = leader.getColumn('F');
            columnF.eachCell((cell, rowNumber) => {
                if (rowNumber > 1 && rowNumber <= leader.rowCount) {
                    cell.alignment = { horizontal: 'right' };
                }
            });

            const columnG = leader.getColumn('G');
            columnG.eachCell((cell, rowNumber) => {
                if (rowNumber > 1 && rowNumber <= leader.rowCount) {
                    cell.alignment = { horizontal: 'right' };
                }
            });

            const columnI = leader.getColumn('I');
            columnI.eachCell((cell, rowNumber) => {
                if (rowNumber > 1 && rowNumber <= leader.rowCount) {
                    cell.alignment = { horizontal: 'right' };
                }
            });
        }
        const depaName = await Department.findOne({ where: { ID: departmentID } });
        let dataDate = '';
        if (month) {
            dataDate = month;
            dataDate += `_${year}`;
        } else dataDate += `${year}`;

        var utc = new Date().toJSON().slice(0, 10).replace(/-/g, '-');
        let stringName = `${depaName.Code.replace(' ', '.')}_${dataDate}_ranking_${utc}`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=' + `${stringName}.xlsx`);

        return workbook.xlsx.write(res).then(function () {
            res.status(200).end();
        });
    } catch (err) {
        console.log('error: ' + err);
    }
});
