class multipleMulter {
    mutipleImage(files) {
        let list = '';
        files.forEach((file) => {
            list = list + `/public/product/${file.filename},`;
        });
        list = list.slice(0, -1);
        return list;
    }

    deMutipleImage(image) {
        let files = image.split(',');
        files.pop();
        return files;
    }
    deleteUpdateImage(image) {
        let files = image.split(',');
        return files;
    }
}

module.exports = new multipleMulter();
