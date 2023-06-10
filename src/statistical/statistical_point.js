const asyncHandler = require('../utils/async-handler');
const { QueryTypes } = require('sequelize');
const { sequelize, UserMaster, Department, Setting } = require('../models');

const { DB_DATABASE } = process.env;

module.exports = asyncHandler(async (req, res, next) => {
    let totalMonth = [];
    for (let month = 1; month <= 12; month++) {
        const { year, departmentID, value } = req.query;

        let pmonth = '',
            umonth = '',
            umonth1 = '',
            wmonth = '',
            wkeyword = '',
            wdkeyword = '',
            limitsql1 = '',
            limitsql2 = '',
            limitsql3 = ` LIMIT 0,5 `,
            udepartmentID = '',
            pdepartmentID = '',
            rankA_plus = 0,
            rankA = 0,
            rankB = 0,
            rankC = 0,
            rankD = 0;
        if (month != null) {
            pmonth = `AND p.${`month`} = ${month}`;
            wmonth = `AND w.${`month`} = ${month}`;
            umonth = `AND u.${`month`} = ${month}`;
            umonth1 = `AND u.${`month`} = ${month - 1}`;
        }
        if (departmentID != null) {
            const setting = await Setting.findOne({
                where: { DepartmentID: departmentID },
            });
            const countUser = await UserMaster.findAll({
                where: { DepartmentID: departmentID, RoleID: [3, 4], Status: [1] },
            });
            if (setting && countUser.length > 0) {
                (rankA_plus = (setting.RankA_plus * countUser.length) / 100),
                    (rankA = (setting.RankA * countUser.length) / 100),
                    (rankB = (setting.RankB * countUser.length) / 100),
                    (rankC = (setting.RankC * countUser.length) / 100),
                    (rankD = (setting.RankD * countUser.length) / 100);
            }

            if (setting && countUser.length > 0) {
                if (0 < countUser.length && countUser.length < 3 && setting.MaxTopNumber === 3) {
                    limitsql3 = ` LIMIT 0,1 `;
                } else if (2 < countUser.length && countUser.length < 5 && setting.MaxTopNumber === 5) {
                    limitsql3 = ` LIMIT 0,3 `;
                } else if (countUser.length > 3 && setting.MaxTopNumber === 4) {
                    limitsql3 = ` LIMIT 0,3 `;
                } else if (countUser.length > 1 && setting.MaxTopNumber === 2) {
                    limitsql3 = ` LIMIT 0,1 `;
                } else {
                    limitsql3 = ` LIMIT 0, ${setting.MaxTopNumber === null ? 5 : setting.MaxTopNumber} `;
                }
            }
            udepartmentID = ` AND u.DepartmentID = ${departmentID} `;
            pdepartmentID = ` AND p.DepartmentID = ${departmentID} `;
        }

        const numberA_plus = Math.round(rankA_plus);
        const numberA = Math.round(rankA);
        const numberC = Math.round(rankC);
        const numberB = Math.round(rankB);
        const numberD = Math.round(rankD);

        const checkA = numberA_plus + numberA;
        const checkB = checkA + numberB;
        const checkC = checkB + numberC;
        const checkD = checkC + numberD;
        const stringKper = `CASE
      WHEN user_rank > 0 and user_rank <= ${numberA_plus} THEN "APlus"
      WHEN user_rank > ${numberA_plus} and user_rank <= ${checkA} THEN "A"
      WHEN user_rank > ${checkA} and user_rank <= ${checkB} THEN "B"
      WHEN user_rank > ${checkB} and user_rank <= ${checkC} THEN "C"
      WHEN user_rank > ${checkC} and user_rank <= ${checkD} THEN "D"
    end as kper`;

        const LeaderBoard = await sequelize.query(
            `
       SELECT 
        ID,DepartmentID,point_plus,point_minus, 
        ${stringKper} 
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
                    t.DepartmentID,
                    t.DisplayName, 
                    t.Email, 
                    t.Account,
                    total_point, 
                    point_plus,
                    point_minus,
                    total_work, 
                    point_per_day, 
                    last_point,
                    b.ImageURL as UserBadge, 
                    user_rank, 
                    ub.${`Order`} as orders 
                  FROM 
                    (
                      SELECT 
                        u.ID, 
                        u.Avatar, 
                        u.DepartmentID,
                        u.DisplayName, 
                        u.Email, 
                        u.Account, 
                        (
                          SELECT 
                            SUM(p.PointOfRule) 
                          FROM 
                            ${DB_DATABASE}.Point p 
                          WHERE 
                            p.UserMasterID = u.ID 
                            AND p.${`Year`} = ${year} ${pmonth} 
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
                            AND p.${`Year`} = ${year} ${pmonth} 
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
                                AND p.${`Year`} = ${year} ${pmonth} 
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
                                    AND p.${`Year`} = ${year} ${pmonth} 
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
                        ) is null then 22 else (
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
                                AND p.${`Year`} = ${year} ${pmonth} 
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
                            ) is null then 22 else (
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
                                AND p.${`Year`} = ${year} ${pmonth} 
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
                            ) is null then 22 else (
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
                            case when (
                              TRUNCATE (
                                (
                                  SELECT
                                    SUM(p.PointOfRule)
                                  from
                                    ${DB_DATABASE}.Point p
                                  WHERE
                                    p.UserMasterID = u.ID
                                    AND p.${`Year`} = ${year} ${pmonth} 
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
                                ) is null then 22 else (
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
                                    AND p.${`Year`} = ${year} ${pmonth} 
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
                                ) is null then 22 else (
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
                            ) end desc, (
                                  SELECT
                                    SUM(p.PointOfRule)
                                  FROM
                                    ${DB_DATABASE}.Point p
                                  WHERE
                                    p.UserMasterID = u.ID
                                    AND p.${`Year`} = ${year} ${pmonth} 
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
                                     AND p.${`Year`} = ${year} ${pmonth} 
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
                            AND p.${`Year`} = ${year} ${pmonth} 
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
                        point_per_day desc ${limitsql1}
                    ) t 
                    LEFT JOIN ${DB_DATABASE}.UserBadge ub ON t.ID = ub.UserMasterID 
                    LEFT JOIN ${DB_DATABASE}.Badge b ON b.ID = ub.BadgeID
                    WHERE ub.Status = 1
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
        ) y ${wkeyword} 
      GROUP BY 
        ID 
      ORDER BY 
      user_rank asc, point_per_day desc  ${limitsql2}      
      
      `,
            { type: QueryTypes.SELECT }
        );
        const sumByDepartmentID = LeaderBoard.reduce((acc, item) => {
            const departmentID = item.DepartmentID;
            const pointPlus = parseInt(item.point_plus) || 0;
            const pointMinus = parseInt(item.point_minus) || 0;

            const totalCoin = pointPlus + pointMinus;

            acc = {
                departmentID: departmentID,
                pointPlus: (acc?.pointPlus || 0) + pointPlus,
                pointMinus: (acc?.pointMinus || 0) + pointMinus,
                totalCoin: (acc?.totalCoin || 0) + totalCoin,
            };
            return acc;
        }, {});
        const getSetting = await Setting.findOne({ where: { DepartmentID: sumByDepartmentID.departmentID } });
        const totalCoin = getSetting.dataValues.ConversionRatio * sumByDepartmentID.totalCoin;
        sumByDepartmentID.totalCoin = totalCoin;
        totalMonth.push(sumByDepartmentID);
    }
    let totalCoinInYear = 0;

    totalMonth.forEach((monthData) => {
        totalCoinInYear += monthData.totalCoin;
    });

    return res.status(200).json({
        success: true,
        totalCoinInYear,
        totalMonth,
    });
});
