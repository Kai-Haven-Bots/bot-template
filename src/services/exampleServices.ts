export const example = async (test: number) => {
    try{
        return test + 1;
    }catch(err: any){
        console.log("Err at /services/exampleServices.ts/example()");
        console.log(err);
        throw new Error(err.message);
    }
}