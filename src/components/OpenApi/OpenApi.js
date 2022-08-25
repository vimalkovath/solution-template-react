import React, { useState } from 'react'
import _ from "lodash";
import SelectDropDown from '../../atoms/DropDown/SelectDropDown';
import { dig } from '../../util/utils';
import Button from '@mui/material/Button';
import ReactJson from 'react-json-view'
import Grid from '@mui/material/Grid';


import InputField from '../../atoms/InputField/InputField';
import Loading from '../../atoms/Loading/Loading';


export default function OpenApi({ session, selectedData }) {
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(false);
    const [answer, setAnswer] = useState([]);
    const api = selectedData;

    console.log(selectedData, "selectedData");

    if (Object.keys(selectedData).length > 0 === false) {
        return <div>No Data selected</div>;
    };

    const serverDropDown = selectedData.servers.map(item => {
        const obj = {};
        obj.label = item.url;
        obj.value = item.url;
        return obj;
    });

    const pathDropDown = Object.keys(selectedData.paths).map((_path) => {
        const a = {};
        a['label'] = _path;
        a['value'] = _path;
        return a;
    });


    const _requestBodyObj = dig(selectedData, 'requestBody');

    const inputProperties = dig(_requestBodyObj, '$ref');
    let refInput = "";
    let responseApi = "";

    if (!!inputProperties) {
        refInput = inputProperties.split('/');
    }

    if (refInput.length > 1) {
        const lastEleemnt = refInput[refInput.length - 1];
        const Objproperties = dig(selectedData, lastEleemnt);
        responseApi = Objproperties.properties;
    } else {
        responseApi = selectedData.components.schemas.Input.properties;
    }


    const handleInputchange = (value, name) => {
        console.log(data, "data", value, name);
        const _dat = _.cloneDeep(data);;
        _dat[name] = value;
        setData(_dat);
    };

    const ask = async () => {
        setLoading(true);
        let refOutput;
        const values = data;

        if (!!inputProperties) {
            refOutput = inputProperties.split('/');
            const Objproperties = await dig(api, refOutput[refOutput.length - 1]);
            responseApi = Objproperties.properties;
        } else {
            responseApi = await dig(api, 'Output');
        }


        const _inputs = { ...values };

        delete _inputs.path;
        delete _inputs.server;


        const url = values.server + values.path;

        const body = {
            ..._inputs
        };

        try {

            const rawResponse = await fetch(url, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });


            const content = await rawResponse.json();
            setAnswer(content);
            console.log(content, "content");
            setLoading(false);
        }
        catch (err) {
            console.log(err)
            setLoading(false);
        }



    }


    return (
        <div>

            {Object.keys(responseApi).map((item, index) => (
                <div key={index}>
                    <InputField
                        placeholder={responseApi[item] ? responseApi[item].description : ""}
                        name={item}
                        value={data[item] || ""}
                        handleInputchange={handleInputchange}
                        classname={`w-100-p ${item}`}
                    />
                </div>
            ))}

            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>

                    <SelectDropDown
                        handleInputchange={handleInputchange}
                        name="server"
                        data={serverDropDown}
                        label={"Server"}
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <SelectDropDown
                        handleInputchange={handleInputchange}
                        name="path"
                        data={pathDropDown}
                        label={"Path"}
                    />
                </Grid>

            </Grid>


            <div className="form-common-padding">
                {!loading && <Button variant="contained"
                    className="button block" onClick={ask}
                >Run</Button>}
                {loading && <Loading />}
            </div>


            {!_.isEmpty(answer) &&
                <ReactJson src={answer} />}

        </div>
    )
}


