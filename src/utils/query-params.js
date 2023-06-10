module.exports = (objQuery, Op, searchField, whereField) => {
    let searchOr = {};
    //--Tìm kiếm tương đối nhiều column một lúc (?keyword=...)
    if (objQuery.keyword && objQuery.keyword != '') {
        searchOr = {
            [Op.or]: [],
        };
        for (const field of searchField) {
            searchOr[Op.or].push({
                [field]: {
                    [Op.substring]: objQuery.keyword,
                },
            });
        }
    }

    //-- Tìm kiếm tuyệt đối (theo key column)
    if (whereField && whereField.length > 0) {
        for (let field of whereField) {
            if (objQuery[field]) {
                searchOr[field] = objQuery[field];
            }
        }
    }

    //-- Sắp xếp tăng hoặc giảm dần theo 1 hay nhiều column: (sort | CreatedDate:ASC && sort | Name:DESC)
    let order = [];
    // if have multiple sort condition
    if (Array.isArray(objQuery.sort)) {
        for (const field of objQuery.sort) {
            order.push(field.split(':'));
        }
    }
    // if have only 1 sort condition
    else if (objQuery.sort) {
        order = [objQuery.sort.split(':')];
    }

    //-- Phân trang theo page size
    const { page, size } = objQuery;

    const limit = +size || null;
    const offset = +size * (+page - 1) || 0;

    return { searchOr, order, limit, offset };
};
