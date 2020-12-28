import fs from 'fs';
import appRoot from "app-root-path";

export const changeFileName = (file, name) => {
    const { originalname } = file;
    const tempData = originalname.split(".");
    let typeImage = "png"
    if (tempData.length > 1) {
        typeImage = tempData[1];
    }
    const newName = `/public/img/${name}.${typeImage}`;
    fs.rename(appRoot.path + `/public/img/${originalname}`, appRoot.path + newName, function (err) {
        if (err) console.log('ERROR: ' + err);
    });

    return newName

}

export const deleteFile = (path) => {
    fs.unlink(path)
}




