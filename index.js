
let verificatorSaveFormKeys,
  structureValidatorMap,
  request,
  jsonfile;

verificatorSaveFormKeys = [
  'page_name',
  'page_back_color',
  'page_font_color',
  'element_design',
  'page_design',
  'auth_container',
  'deliver_container',
  'quota_container',
  'items',
  'id',
  'active',
  'deleted'
];
request = require( 'request' );
jsonfile = require( 'jsonfile' );


function setStructure( json, callback ) {
  structureValidatorMap = json;
  jsonfile.writeFile( __dirname+'/validatorKeys.json', json, function resFileWrite( err ) {
    if ( err ) {
      let resMes = {
        status: 'error',
        message: 'structre not saved :(',
        errKeys: err
      };
      callback( resMes, null );
    } else {
      let resMes = {
        status: 'success',
        message: 'structre saved :)'
      };
      callback( null, resMes );
    }
  });
}

function structureValidator( structure, command ) {
  structureValidatorMap = require( __dirname+'/validatorKeys.json' );
  for ( let i = 0; i < structureValidatorMap.length; i++ ) {
    if ( structureValidatorMap[ i ][ 'command' ] == command ) {
      let resultOfKeysStructure = keysValidator( structureValidatorMap[ i ][ 'keys' ], structure );
      return resultOfKeysStructure;
    }
  }
}

function keysValidator( keys, structure ) {
  let structureKeys,
    unfindenColumns,
    findedColumns;
  structureKeys = Object.keys( structure );
  unfindenColumns = [];
  findedColumns = [];
  for ( let i = 0; i < structureKeys.length; i++ ) {
    let thisKeyFinded = false;
    for ( let j = 0; j < keys.length; j++ ) {
      if ( keys[ j ] === structureKeys[ i ]) {
        findedColumns.push( structureKeys[ i ]);
        thisKeyFinded = true;
        break;
      }
    }
    if ( thisKeyFinded === false ) {
      unfindenColumns.push( structureKeys[ i ]);
    }
  }
  if ( unfindenColumns.length !== 0 ) {
    return { status: 'error', message: 'keys not matched', errKeys: unfindenColumns };
  } else {
    return { status: 'success', message: 'keys matched' };
  }
}

function jsonStringValidator( jsonStr ) {
  if ( typeof jsonStr === 'object' || Array.isArray( jsonStr ) ){
    return { status: 'success', message: 'json parsed successfully', json: jsonStr };
  } else {
    try {
      let json = JSON.parse( jsonStr );
      return { status: 'success', message: 'json parsed successfully', json: json };
  
    } catch ( e ) {
      return { status: 'error', message: 'keys not matched', errJson: e };
    }
  }
}

function tokenHeaderValidator( headerValue ) {
  if ( headerValue ) {
    headerValue = headerValue.split( ' ' );
    if ( headerValue[ 0 ] && headerValue[ 0 ] === 'Bearer' ) {
      if ( headerValue[ 1 ]) {
        return {
          status: 'success',
          message: 'Token valid',
          token: headerValue[ 1 ]
        }
      } else {
        return {
          status: 'error',
          message: 'Token not valid',
        }
      }

    } else {
      return {
        status: 'error',
        message: 'Bearer format is not valid',
      }
    }
  } else {
    return {
      status: 'error',
      message: 'Value is null'
    };
  }
}
function requestOnUsers( url, token, callback ) {
  request.get( url + '/' + token,
    function resFunc( reqErr, reqRes, reqBody ) {
      if ( reqErr ) {
        let resMes = {
          microservice: 'forms',
          status: 'error',
          code: '004-400-003',
          message: 'users service request failed in forms service',
          error: reqErr
        };
        callback( resMes, null );

      }
      let jsonValidatorResults,
        userInfo,
        resSuccessMes;
      jsonValidatorResults = jsonStringValidator( reqBody );
      if ( jsonValidatorResults[ 'status' ] != 'success' ) {
        let resMes = {
          microservice: 'forms',
          status: 'error',
          code: '004-400-004',
          message: 'users response json structure not valid',
          error: jsonValidatorResults[ 'errJson' ]
        };
        callback( resMes, null );
      } else {
        reqBody = jsonValidatorResults[ 'json' ];
      }
      userInfo = reqBody;
      callback( null, reqBody );
    });
}
function getUserInfo( token, callback ) {
  let tokenValid = tokenHeaderValidator( token );
  if ( tokenValid[ 'status' ] == 'success' ) {
    requestOnUsers( tokenValid[ 'token' ],
      function uInfo( errUser, successUser ) {
        if ( errUser ) {
          callback( errUser, null );
        } else {
          callback( null, successUser );
        }
      });
  } else {
    callback( tokenValid, null );
  }
}

module.exports = {
  structureValidator: structureValidator,
  jsonStringValidator: jsonStringValidator,
  getUserInfo: getUserInfo,
  setStructure: setStructure
}
