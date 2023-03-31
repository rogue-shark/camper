/* NOTE:
- func -> is what we pass in i.e. our async function
- this return a new function that has func executed and catches any errors that occur
*/

module.exports = func => {
    return (req, res, next) => {
        func(req, res, next).catch(next);
    }
}
