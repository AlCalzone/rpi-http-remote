"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function promisify(fn, context) {
    return function (...args) {
        context = context || this;
        return new Promise((resolve, reject) => {
            fn.apply(context, [...args, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    else {
                        return resolve(result);
                    }
                }]);
        });
    };
}
exports.promisify = promisify;
function promisifyNoError(fn, context) {
    return function (...args) {
        context = context || this;
        return new Promise((resolve, reject) => {
            fn.apply(context, [...args, (result) => {
                    return resolve(result);
                }]);
        });
    };
}
exports.promisifyNoError = promisifyNoError;
function waterfall(...fn) {
    // Führt eine Reihe von Promises sequentiell aus
    // TODO: Rückgabewerte prüfen (ob da was zu viel ist)
    return fn.reduce((prev, cur) => prev.then(cur), Promise.resolve());
}
exports.waterfall = waterfall;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvbWlzZXMuanMiLCJzb3VyY2VSb290IjoiQzovVXNlcnMvRG9taW5pYy9Eb2N1bWVudHMvVmlzdWFsIFN0dWRpbyAyMDE3L1JlcG9zaXRvcmllcy9ycGktaHR0cC1yZW1vdGUvc3JjLyIsInNvdXJjZXMiOlsicHJvbWlzZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOztBQVFiLG1CQUEwQixFQUFFLEVBQUUsT0FBYTtJQUMxQyxNQUFNLENBQUMsVUFBUyxHQUFHLElBQUk7UUFDdEIsT0FBTyxHQUFHLE9BQU8sSUFBSSxJQUFJLENBQUM7UUFDMUIsTUFBTSxDQUFDLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU07WUFDbEMsRUFBRSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLElBQUksRUFBRSxDQUFDLEtBQUssRUFBRSxNQUFNO29CQUN6QyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO3dCQUNYLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQ3RCLENBQUM7b0JBQUMsSUFBSSxDQUFDLENBQUM7d0JBQ1AsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDeEIsQ0FBQztnQkFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUM7QUFDSCxDQUFDO0FBYkQsOEJBYUM7QUFHRCwwQkFBaUMsRUFBRSxFQUFFLE9BQU87SUFDeEMsTUFBTSxDQUFDLFVBQVMsR0FBRyxJQUFJO1FBQ25CLE9BQU8sR0FBRyxPQUFPLElBQUksSUFBSSxDQUFDO1FBQzFCLE1BQU0sQ0FBQyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNO1lBQy9CLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNO29CQUMvQixNQUFNLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUMzQixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ1IsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDLENBQUM7QUFDTixDQUFDO0FBVEQsNENBU0M7QUFFRCxtQkFBMEIsR0FBRyxFQUFxQjtJQUNqRCxnREFBZ0Q7SUFDaEQscURBQXFEO0lBQ3JELE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUNmLENBQUMsSUFBSSxFQUFFLEdBQUcsS0FBSyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUM3QixPQUFPLENBQUMsT0FBTyxFQUFFLENBQ2pCLENBQUM7QUFDSCxDQUFDO0FBUEQsOEJBT0MifQ==