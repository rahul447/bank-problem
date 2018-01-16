var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
import checkEnvironmentVariables from "./util/checkEnvironmentVariables";
import {router, app} from "./routes/mainRouter";
import mwAllowCrossDomain from "./middlewares/mwAllowCrossDomain";
import methodOverride from "method-override";
import mwErrorHandler from "./middlewares/mwErrorHandler";

let {NODE_ENV} = process.env,
    nodeEnv = NODE_ENV || "development",
    config = Object.freeze(require("../config/" + nodeEnv)),
    urlPrefix = config.urlPrefix,
    environmentVariables = require("../config/environmentVariables");

if (config.environmentVariableChecker.isEnabled) {
    checkEnvironmentVariables(environmentVariables);
}

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(mwAllowCrossDomain);
app.use(methodOverride);
app.use(mwErrorHandler);
app.use(`${urlPrefix}`, router);
app.set('port', config['process.env.PORT'] || 3000);

var server = app.listen(app.get('port'), function() {
    console.log('Express server listening on port ' + server.address().port);
    console.log("============Welcome to CMS===============");
    console.log("Mode:", config.mode);
    console.log("Port:", config['process.env.PORT']);
});

module.exports = app;
