import { BufferData } from '$entities/Buffer';
import { HandleServiceResponseCustomError, HandleServiceResponseSuccess, ServiceResponse } from '$entities/Service';
import TableToXlsx from '@nodewave/table-to-xlsx';
import fs from 'fs';
import handlebars from "handlebars";
import path from "path";
import puppeteer from "puppeteer";

export async function getPDF(): Promise<ServiceResponse<BufferData | {}>> {
    // Define the path to the Handlebars template file
    const templateData = {
        title: "Test"
    }
    const templatePath = path.join(__dirname, '../../templates/test.hbs');
    const template = fs.readFileSync(templatePath, 'utf-8');
    const compiledTemplate = handlebars.compile(template);
    const renderedTemplate = compiledTemplate(templateData);

    const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
    const page = await browser.newPage();
    await page.setContent(renderedTemplate, { waitUntil: 'networkidle0' });
    const buffer = await page.pdf({
        format: 'A4',
        landscape: true,
        margin: {
            top: 16,
            bottom: 16,
            left: 16,
            right: 16
        }
    });
    await browser.close();


    const fileName = `Example`;

    const resData: BufferData = {
        buffer,
        fileName
    }

    return HandleServiceResponseSuccess(resData)
}


type SampleData = {
    productName: string;
    price: number;
    quantity: number;
    totalPrice: number;
    date: string;
    customerName: string;
    customerEmail: string;
}

function buildSampleHtmlTable(data: SampleData[]) {

    const titleHeader = `
        <tr>
            <th style="background-color: #f0f0f0;" colspan="8">Order Recap</th>
        </tr>
        <tr>
            <th style="background-color: #f0f0f0;" colspan="8"></th>
        </tr>
    `

    return `
    <table>
        <thead>
            ${titleHeader}

             <tr>
                <th rowspan="2">No</th>
                <th colspan="5">Product Information</th>
                <th colspan="2">Customer Information</th>
            </tr>
            <tr>
                <th></th>
                <th>Product Name</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Total Price</th>
                <th>Date</th>
                <th>Customer Name</th>
                <th>Customer Email</th>
            </tr>
           
        </thead>
        <tbody>
        
            ${data.map((item, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${item.productName}</td>
                    <td>${item.price}</td>
                    <td>${item.quantity}</td>
                    <td>${item.totalPrice}</td>
                    <td>${item.date}</td>
                    <td>${item.customerName}</td>
                    <td>${item.customerEmail}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    `
}

export async function getXLSX(): Promise<ServiceResponse<BufferData | {}>> {
    try {
        const data: SampleData[] = [
            {
                productName: "Product 1",
                price: 100,
                quantity: 1,
                totalPrice: 100,
                date: "2021-01-01",
                customerName: "Customer 1",
                customerEmail: "customer1@example.com"
            },
            {
                productName: "Product 2",
                price: 200,
                quantity: 2,
                totalPrice: 400,
                date: "2021-01-02",
                customerName: "Customer 2",
                customerEmail: "customer2@example.com"
            }
        ]
        const htmlTable = buildSampleHtmlTable(data)
        const excelBuffer = await TableToXlsx.convertToBuffer(htmlTable)
        const resData: BufferData = {
            buffer: excelBuffer,
            fileName: "Example"
        }

        return HandleServiceResponseSuccess(resData)
    } catch (error) {
        return HandleServiceResponseCustomError("Internal Server Error", 500)
    }
}