export const getProfileHandler = (req, res) => {
    try {
        const { _id, hashPassword, ...userData } = req.user;
        return res.status(200).json(userData);
    } catch (error) {
        console.error("Error when calling getProfileHandler: " + error);
        return res.status(500).send();
    }
}